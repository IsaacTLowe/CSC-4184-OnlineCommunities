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

const credentials = { clientId: 'private-client', clientSecret: 'private-secret' }
const game = (id, platforms, name = `Catalog game ${id}`) => ({
  id, name, slug: `game-${id}`, first_release_date: 1704067200,
  cover: { image_id: 'example' }, platforms, genres: [{ name: 'Adventure' }],
})
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
const tokenResponse = () => json({ access_token: 'private-access-token', expires_in: 3600 })

test('IGDB queries support platform, search, genre, sorting and pagination without exposing credentials', async () => {
  const calls = []
  const catalog = createCatalog({ ...credentials, fetchImpl: async (url, options) => {
    calls.push({ url: String(url), ...options })
    if (String(url).includes('id.twitch.tv')) return tokenResponse()
    return json([{ name: 'games', result: [game(101, [49, 167])] }, { name: 'total', count: 49 }])
  } })
  const result = await catalog.list('xbox', { search: 'a "game"', genre: 'adventure', console: '49', sort: 'name', page: '2' })
  const query = calls[1].body
  assert.ok(query.includes('platforms = (49)'))
  assert.ok(query.includes('genres = (31)'))
  assert.ok(query.includes('name ~ *' + JSON.stringify('a "game"') + '*'))
  assert.ok(query.includes('sort name asc'))
  assert.ok(query.includes('offset 24'))
  assert.equal(calls[1].headers.Authorization, 'Bearer private-access-token')
  assert.equal(calls[1].headers['Client-ID'], credentials.clientId)
  assert.equal(result.hasNext, true)
  assert.equal(result.count, 49)
  assert.equal(result.games[0].id, 'xbox:igdb:101')
  assert.deepEqual(result.games[0].consoles, ['Xbox One'])
  assert.ok(!JSON.stringify(result).includes('private-'))
  await catalog.list('playstation')
  assert.equal(calls.filter((call) => call.url.includes('id.twitch.tv')).length, 1)
  await assert.rejects(catalog.list('xbox', { console: '167' }), { status: 400 })
  await assert.rejects(catalog.list('playstation', { page: '-1' }), { status: 400 })
  await assert.rejects(catalog.list('xbox', { genre: 'made-up' }), { status: 400 })
})

test('IGDB configuration, network and upstream errors are actionable', async () => {
  await assert.rejects(createCatalog().list('xbox'), { status: 503 })
  const offline = createCatalog({ ...credentials, fetchImpl: async () => { throw new Error('private details') } })
  await assert.rejects(offline.list('playstation'), { status: 502, message: 'Couldn’t reach the game catalog. Please try again.' })
  for (const [response, status] of [[json({}, 429), 503], [json({ unexpected: true }), 502]]) {
    const catalog = createCatalog({ ...credentials, fetchImpl: async (url) => String(url).includes('id.twitch.tv') ? tokenResponse() : response })
    await assert.rejects(catalog.list('xbox'), { status })
  }
})

test('IGDB renews rejected tokens once and coalesces concurrent authentication', async () => {
  let tokens = 0, requests = 0
  const catalog = createCatalog({ ...credentials, fetchImpl: async (url) => {
    if (String(url).includes('id.twitch.tv')) { tokens++; return tokenResponse() }
    requests++
    if (requests === 1) return json({}, 401)
    return json([{ name: 'games', result: [] }, { name: 'total', count: 0 }])
  } })
  await Promise.all([catalog.list('xbox'), catalog.list('playstation')])
  assert.equal(tokens, 2)
  assert.equal(requests, 3)
  const rejected = createCatalog({ ...credentials, fetchImpl: async (url) => String(url).includes('id.twitch.tv') ? tokenResponse() : json({}, 401) })
  await assert.rejects(rejected.list('xbox'), { status: 503 })
})

test('account libraries persist console selections and retain the complete Steam import workflow', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'gamefinder-library-'))
  const dbFile = pathToFileURL(join(dir, 'users.json'))
  const password = 'test-password'
  const account = (extra = {}) => ({ salt: 'test-salt', passwordHash: scryptSync(password, 'test-salt', 64).toString('hex'), ...extra })
  writeFileSync(dbFile, JSON.stringify({
    alice: account({ steamId: '76561198000000000', ownedAppIds: [10], prefs: ['Puzzle'], steamLibrary: { games: [{ appid: 10, title: 'Original Steam game' }] } }),
    bob: account(),
    legacy: account({ consoleGames: [{ id: 'xbox:101', catalogId: 101, platform: 'xbox', title: 'Older saved game' }] }),
  }))
  const fixtures = new Map([
    [101, game(101, [49, 169], 'Xbox exclusive')],
    [102, game(102, [49, 167], 'Shared title')],
    [103, game(103, [169], 'Another Xbox game')],
    [201, game(201, [48, 167], 'PlayStation exclusive')],
    [999, game(999, [4], 'PC only')],
  ])
  let steamGames = [{ appid: 20, name: 'New Steam game', playtime_forever: 120 }]
  let failSteam = false
  const fetchImpl = async (input, options) => {
    const url = new URL(input)
    if (url.hostname === 'id.twitch.tv') return tokenResponse()
    if (url.hostname === 'api.igdb.com') {
      if (url.pathname === '/v4/multiquery') return json([{ name: 'games', result: [fixtures.get(101), fixtures.get(102)] }, { name: 'total', count: 2 }])
      const ids = options.body.match(/where id = \(([^)]+)\)/)[1].split(',').map(Number)
      return json(ids.map((id) => fixtures.get(id)).filter(Boolean))
    }
    if (url.hostname === 'api.steampowered.com') return failSteam ? json({}, 503) : json({ response: { game_count: steamGames.length, games: steamGames } })
    if (url.hostname === 'store.steampowered.com') return json({ [url.searchParams.get('appids')]: { data: { genres: [{ description: 'Action' }], categories: [], short_description: 'A co-op adventure.' } } })
    if (url.hostname === 'steamcommunity.com') return new Response('is_valid:true')
    throw new Error(`Unexpected upstream: ${url.hostname}`)
  }
  let server
  let baseUrl
  async function start() {
    const app = createApp({ dbFile, steamApiKey: 'steam-test-key', catalogClientId: credentials.clientId, catalogClientSecret: credentials.clientSecret, fetchImpl })
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
    const result = await request('/api/catalog/xbox/games?search=game&genre=adventure&console=49&page=1')
    assert.equal(result.status, 200)
    assert.equal(result.data.games.length, 2)
    assert.ok(!JSON.stringify(result.data).includes('private-secret'))
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
    const result = await request('/api/library/xbox/games/igdb:102', { cookie: alice, method: 'DELETE' })
    assert.equal(result.status, 200)
    assert.ok(!result.data.library.games.some((g) => g.id === 'xbox:igdb:102'))
    assert.ok(result.data.library.games.some((g) => g.id === 'playstation:igdb:102'))
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
    assert.deepEqual((await request('/api/library', { cookie })).data.library.games.map((g) => g.id).sort(), ['playstation:igdb:201', 'xbox:igdb:101', 'xbox:igdb:103'])
  })
  await t.test('older catalog games remain readable and removable without colliding with IGDB IDs', async () => {
    const cookie = await login('legacy')
    const added = await request('/api/library/xbox/games', { cookie, method: 'POST', body: { gameIds: [101] } })
    assert.deepEqual(added.data.library.games.map((g) => g.id), ['xbox:101', 'xbox:igdb:101'])
    const removed = await request('/api/library/xbox/games/101', { cookie, method: 'DELETE' })
    assert.deepEqual(removed.data.library.games.map((g) => g.id), ['xbox:igdb:101'])
  })

})
