import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { scryptSync } from 'node:crypto'
import { createApp } from './index.js'
import { createCatalog } from './catalog.js'

const game = (id, platforms, name = `Catalog game ${id}`) => ({
  id, name, slug: `game-${id}`, released: '2024-01-01',
  background_image: 'https://media.rawg.io/example.jpg',
  platforms: platforms.map((id) => ({ platform: { id } })),
  genres: [{ name: 'Adventure' }],
})
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })

test('console catalogs forward search, platform, genre, sort and pagination without exposing the API key', async () => {
  const urls = []
  const catalog = createCatalog({ apiKey: 'private-test-key', fetchImpl: async (url) => {
    urls.push(new URL(url))
    return json({ count: 49, next: 'https://api.rawg.io/api/games?page=3&key=private-test-key', results: [game(101, [1, 187])] })
  } })
  const result = await catalog.list('xbox', { search: 'a game', genre: 'adventure', console: '1', sort: 'name', page: '2' })
  assert.equal(urls[0].searchParams.get('parent_platforms'), '3')
  assert.equal(urls[0].searchParams.get('platforms'), '1')
  assert.equal(urls[0].searchParams.get('genres'), 'adventure')
  assert.equal(urls[0].searchParams.get('search'), 'a game')
  assert.equal(urls[0].searchParams.get('ordering'), 'name')
  assert.equal(urls[0].searchParams.get('page'), '2')
  assert.equal(result.hasNext, true)
  assert.equal(result.count, 49)
  assert.deepEqual(result.games[0].consoles, ['Xbox One'])
  assert.ok(!JSON.stringify(result).includes('private-test-key'))
  const psResult = await catalog.list('playstation')
  assert.equal(urls[1].searchParams.get('parent_platforms'), '2')
  assert.deepEqual(psResult.games[0].consoles, ['PlayStation 5'])
  await assert.rejects(catalog.list('xbox', { console: '187' }), { status: 400 })
  await assert.rejects(catalog.list('playstation', { page: '-1' }), { status: 400 })
  await assert.rejects(catalog.list('xbox', { genre: 'made-up' }), { status: 400 })
})

test('catalog configuration, network and upstream failures return actionable errors', async () => {
  await assert.rejects(createCatalog().list('xbox'), { status: 503 })
  const offline = createCatalog({ apiKey: 'key', fetchImpl: async () => { throw new Error('network failure with private context') } })
  await assert.rejects(offline.list('playstation'), { status: 502, message: 'Couldn’t reach the game catalog. Please try again.' })
  const busy = createCatalog({ apiKey: 'key', fetchImpl: async () => json({}, 429) })
  await assert.rejects(busy.list('xbox'), { status: 503 })
  const broken = createCatalog({ apiKey: 'key', fetchImpl: async () => json({ unexpected: true }) })
  await assert.rejects(broken.list('xbox'), { status: 502 })
})

test('account libraries persist console selections and retain the complete Steam import workflow', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'gamefinder-library-'))
  const dbFile = pathToFileURL(join(dir, 'users.json'))
  const password = 'test-password'
  const account = (extra = {}) => ({ salt: 'test-salt', passwordHash: scryptSync(password, 'test-salt', 64).toString('hex'), ...extra })
  writeFileSync(dbFile, JSON.stringify({
    alice: account({ steamId: '76561198000000000', ownedAppIds: [10], prefs: ['Puzzle'], steamLibrary: { games: [{ appid: 10, title: 'Original Steam game' }] } }),
    bob: account(),
  }))
  const fixtures = new Map([
    [101, game(101, [1, 186], 'Xbox exclusive')],
    [102, game(102, [1, 187], 'Shared title')],
    [103, game(103, [186], 'Another Xbox game')],
    [201, game(201, [18, 187], 'PlayStation exclusive')],
    [999, game(999, [4], 'PC only')],
  ])
  let steamGames = [{ appid: 20, name: 'New Steam game', playtime_forever: 120 }]
  let failSteam = false
  const fetchImpl = async (input) => {
    const url = new URL(input)
    if (url.hostname === 'api.rawg.io') {
      if (url.pathname === '/api/games') return json({ count: 2, next: null, results: [fixtures.get(101), fixtures.get(102)] })
      const item = fixtures.get(Number(url.pathname.split('/').pop()))
      return item ? json(item) : json({}, 404)
    }
    if (url.hostname === 'api.steampowered.com') return failSteam ? json({}, 503) : json({ response: { game_count: steamGames.length, games: steamGames } })
    if (url.hostname === 'store.steampowered.com') return json({ [url.searchParams.get('appids')]: { data: { genres: [{ description: 'Action' }], categories: [], short_description: 'A co-op adventure.' } } })
    if (url.hostname === 'steamcommunity.com') return new Response('is_valid:true')
    throw new Error(`Unexpected upstream: ${url.hostname}`)
  }
  let server
  let baseUrl
  async function start() {
    const app = createApp({ dbFile, steamApiKey: 'steam-test-key', catalogApiKey: 'rawg-test-key', fetchImpl })
    server = app.listen(0, '127.0.0.1')
    await once(server, 'listening')
    baseUrl = `http://127.0.0.1:${server.address().port}`
  }
  async function stop() {
    if (!server?.listening) return
    server.closeAllConnections()
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
  t.after(async () => { await stop(); rmSync(dir, { recursive: true, force: true }) })
  await start()
  async function request(path, { method = 'GET', body, cookie } = {}) {
    const response = await fetch(baseUrl + path, {
      method, redirect: 'manual',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await response.json().catch(() => null)
    return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0], location: response.headers.get('location') }
  }
  const login = async (username) => (await request('/api/login', { method: 'POST', body: { username, password } })).cookie
  let alice = await login('alice')
  const bob = await login('bob')

  await t.test('the catalog is browsable without a console or GameFinder sign-in', async () => {
    const result = await request('/api/catalog/xbox/games?search=game&genre=adventure&console=1&page=1')
    assert.equal(result.status, 200)
    assert.equal(result.data.games.length, 2)
    assert.ok(!JSON.stringify(result.data).includes('rawg-test-key'))
    assert.equal((await request('/api/catalog/steam/games')).status, 400)
  })

  await t.test('existing Steam imports appear in the general library without migration', async () => {
    const result = await request('/api/library', { cookie: alice })
    assert.equal(result.status, 200)
    assert.deepEqual(result.data.steam, { connected: true, imported: true })
    assert.deepEqual(result.data.library.games.map((g) => g.id), ['steam:10'])
    assert.deepEqual((await request('/api/steam/library', { cookie: alice })).data.library.games, [{ appid: 10, title: 'Original Steam game' }])
    assert.equal((await request('/api/library')).status, 401)
    assert.equal((await request('/api/library/xbox/games', { method: 'POST', body: { gameIds: [101] } })).status, 401)
  })

  await t.test('bulk adding deduplicates within a platform and preserves copies on other platforms', async () => {
    const xbox = await request('/api/library/xbox/games', { cookie: alice, method: 'POST', body: { gameIds: [101, 102, 101], title: 'Forged title' } })
    assert.equal(xbox.status, 201)
    assert.equal(xbox.data.addedCount, 2)
    assert.equal(xbox.data.library.games.find((g) => g.catalogId === 101).title, 'Xbox exclusive')
    const ps = await request('/api/library/playstation/games', { cookie: alice, method: 'POST', body: { gameIds: [201, 102] } })
    assert.equal(ps.data.addedCount, 2)
    assert.equal(ps.data.library.games.length, 5)
    assert.equal(ps.data.library.games.filter((g) => g.catalogId === 102).length, 2)
    const duplicate = await request('/api/library/xbox/games', { cookie: alice, method: 'POST', body: { gameIds: [101] } })
    assert.equal(duplicate.data.addedCount, 0)
    assert.equal(duplicate.data.library.games.length, 5)
  })

  await t.test('console collections are account-specific and do not require Steam', async () => {
    const result = await request('/api/library/xbox/games', { cookie: bob, method: 'POST', body: { gameIds: [101] } })
    assert.equal(result.data.library.games.length, 1)
    assert.deepEqual(result.data.steam, { connected: false, imported: false })
    assert.equal((await request('/api/library', { cookie: alice })).data.library.games.length, 5)
  })

  await t.test('invalid and wrong-platform selections cannot cause partial writes or modify Steam imports', async () => {
    for (const [platform, ids] of [['steam', [101]], ['constructor', [101]], ['xbox', []], ['xbox', ['101']], ['xbox', [201]], ['xbox', [103, 999]], ['xbox', Array(51).fill(101)]]) {
      assert.equal((await request(`/api/library/${platform}/games`, { cookie: alice, method: 'POST', body: { gameIds: ids } })).status, 400)
    }
    assert.equal((await request('/api/library', { cookie: alice })).data.library.games.length, 5)
    assert.equal((await request('/api/library/steam/games/10', { cookie: alice, method: 'DELETE' })).status, 400)
  })

  await t.test('removing a console copy leaves other accounts and platforms intact', async () => {
    const result = await request('/api/library/xbox/games/102', { cookie: alice, method: 'DELETE' })
    assert.equal(result.status, 200)
    assert.ok(!result.data.library.games.some((g) => g.id === 'xbox:102'))
    assert.ok(result.data.library.games.some((g) => g.id === 'playstation:102'))
    assert.equal((await request('/api/library', { cookie: bob })).data.library.games.length, 1)
  })

  await t.test('Steam import and re-import update games, owned IDs and recommendations without overwriting console games', async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await request('/api/steam/import', { cookie: alice, method: 'POST' })
      assert.equal(result.status, 200)
      assert.deepEqual(result.data.library.games, [{ appid: 20, title: 'New Steam game' }])
      assert.deepEqual(result.data.user.ownedAppIds, [20])
      assert.ok(result.data.user.prefs.includes('Combat'))
      assert.equal(result.data.generalLibrary.games.length, 4)
      assert.equal(result.data.generalLibrary.games.filter((g) => g.platform !== 'steam').length, 3)
    }
    failSteam = true
    assert.equal((await request('/api/steam/import', { cookie: alice, method: 'POST' })).status, 502)
    assert.equal((await request('/api/library', { cookie: alice })).data.library.games.length, 4)
    failSteam = false
    steamGames = []
    assert.equal((await request('/api/steam/import', { cookie: alice, method: 'POST' })).data.generalLibrary.games.length, 3)
    assert.equal((await request('/api/library', { cookie: alice })).data.steam.imported, true)
  })

  await t.test('Steam sign-in and relinking retain console collections', async () => {
    const signIn = await request('/api/steam/login', { cookie: alice })
    assert.equal(new URL(signIn.location).hostname, 'steamcommunity.com')
    const params = new URLSearchParams({ 'openid.claimed_id': 'https://steamcommunity.com/openid/id/76561198000000001' })
    assert.equal((await request(`/api/steam/return?${params}`, { cookie: alice })).status, 302)
    const result = await request('/api/library', { cookie: alice })
    assert.equal(result.data.library.games.length, 3)
    assert.equal(result.data.steam.imported, false)
  })

  await t.test('saved console collections survive a backend restart', async () => {
    const saved = JSON.parse(readFileSync(dbFile, 'utf8'))
    assert.equal(saved.alice.consoleGames.length, 3)
    assert.equal(saved.bob.consoleGames.length, 1)
    await stop()
    await start()
    assert.equal((await request('/api/library', { cookie: alice })).status, 401)
    alice = await login('alice')
    assert.equal((await request('/api/library', { cookie: alice })).data.library.games.length, 3)
  })

  await t.test('concurrent platform additions do not lose games', async () => {
    const cookie = await login('bob')
    const results = await Promise.all([
      request('/api/library/xbox/games', { cookie, method: 'POST', body: { gameIds: [103] } }),
      request('/api/library/playstation/games', { cookie, method: 'POST', body: { gameIds: [201] } }),
    ])
    assert.ok(results.every((result) => result.status === 201))
    assert.deepEqual((await request('/api/library', { cookie })).data.library.games.map((g) => g.id).sort(), ['playstation:201', 'xbox:101', 'xbox:103'])
  })
})
