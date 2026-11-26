// Username/password accounts, Steam imports and a shared console game library.
import express from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { CatalogError, createCatalog, createCatalogRouter } from './catalog.js'
import { createLibraryRouter, libraryState } from './library.js'

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url
if (isMain && fs.existsSync('.env')) process.loadEnvFile('.env')

// Injectable storage and upstream fetch keep integration tests away from real
// accounts and external Steam/RAWG services.
export function createApp({
  dbFile = new URL('./data/users.json', import.meta.url),
  steamApiKey = process.env.STEAM_API_KEY,
  catalogApiKey = process.env.RAWG_API_KEY,
  appUrl = process.env.APP_URL ?? 'http://localhost:5173',
  fetchImpl = globalThis.fetch,
} = {}) {
  const DB_FILE = dbFile
  const PENDING_DB_FILE = new URL('./users.tmp', DB_FILE)
  const APP_URL = appUrl
  const STEAM_API_KEY = steamApiKey
  const fetch = fetchImpl

  // ---------- storage: a JSON file is enough for a class project ----------
  const users = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : {}
  const saveUsers = (data = users) => {
    fs.mkdirSync(new URL('./', DB_FILE), { recursive: true })
    fs.writeFileSync(PENDING_DB_FILE, JSON.stringify(data, null, 2))
    fs.renameSync(PENDING_DB_FILE, DB_FILE)
  }
  const publicUser = (username) => {
    const { steamId = null, prefs = null, ownedAppIds = [] } = users[username]
    return { username, steamId, prefs, ownedAppIds }
  }

  // ---------- passwords + sessions ----------
  const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex')
  const sessions = new Map() // token -> username (in memory: restarting the server logs everyone out)

  const app = express()
  app.use(express.json())
  const catalog = createCatalog({ apiKey: catalogApiKey, fetchImpl })

  // Attach req.username if the request has a valid session cookie.
  app.use((req, _res, next) => {
    const token = req.headers.cookie?.match(/(?:^|;\s*)sid=([^;]+)/)?.[1]
    req.username = sessions.get(token)
    next()
  })

  function startSession(res, username) {
    const token = crypto.randomBytes(32).toString('hex')
    sessions.set(token, username)
    // SameSite=Lax so the cookie still comes back on the redirect from Steam.
    res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Lax; Path=/`)
  }

  const requireLogin = (req, res, next) =>
    req.username ? next() : res.status(401).json({ error: 'Please log in first' })

  app.post('/api/register', (req, res) => {
    const { username = '', password = '' } = req.body
    if (!/^\w{3,20}$/.test(username)) return res.status(400).json({ error: 'Username must be 3-20 letters, numbers or _' })
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
    if (users[username]) return res.status(409).json({ error: 'That username is taken' })

    const salt = crypto.randomBytes(16).toString('hex')
    users[username] = { salt, passwordHash: hashPassword(password, salt) }
    saveUsers()
    startSession(res, username)
    res.json({ user: publicUser(username) })
  })

  app.post('/api/login', (req, res) => {
    const { username = '', password = '' } = req.body
    const user = users[username]
    const ok =
      user &&
      crypto.timingSafeEqual(Buffer.from(hashPassword(password, user.salt), 'hex'), Buffer.from(user.passwordHash, 'hex'))
    if (!ok) return res.status(401).json({ error: 'Wrong username or password' })
    startSession(res, username)
    res.json({ user: publicUser(username) })
  })

  app.post('/api/logout', (req, res) => {
    for (const [token, name] of sessions) if (name === req.username) sessions.delete(token)
    res.setHeader('Set-Cookie', 'sid=; Max-Age=0; Path=/')
    res.json({ ok: true })
  })

  app.get('/api/me', requireLogin, (req, res) => res.json({ user: publicUser(req.username) }))

  app.put('/api/prefs', requireLogin, (req, res) => {
    users[req.username].prefs = req.body.prefs
    saveUsers()
    res.json({ user: publicUser(req.username) })
  })

  // The general library includes the saved Steam import and manual console games.
  app.use('/api/library', requireLogin, createLibraryRouter({ users, saveUsers, catalog }))
  app.use('/api/catalog', createCatalogRouter(catalog))

  // ---------- Steam sign-in (OpenID 2.0) ----------
  const STEAM_OPENID = 'https://steamcommunity.com/openid/login'

  // Step 1: send the browser to Steam's login page.
  app.get('/api/steam/login', requireLogin, (_req, res) => {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${APP_URL}/api/steam/return`,
      'openid.realm': APP_URL,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    })
    res.redirect(`${STEAM_OPENID}?${params}`)
  })

  // Step 2: Steam sends the browser back here. Ask Steam to confirm the response
  // is genuine, then pull the 17-digit SteamID out of claimed_id.
  app.get('/api/steam/return', requireLogin, async (req, res) => {
    const check = new URLSearchParams(req.query)
    check.set('openid.mode', 'check_authentication')
    const verify = await fetch(STEAM_OPENID, { method: 'POST', body: check }).then((r) => r.text())
    const steamId = req.query['openid.claimed_id']?.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/)?.[1]

    if (!verify.includes('is_valid:true') || !steamId) return res.redirect(`${APP_URL}/login?steam=failed`)

    const user = users[req.username]
    if (user.steamId !== steamId) {
      const linkedUser = { ...user, steamId, steamLibrary: null, ownedAppIds: [] }
      saveUsers({ ...users, [req.username]: linkedUser })
      Object.assign(user, linkedUser)
    }
    res.redirect(`${APP_URL}/library`)
  })

  // ---------- Steam library import + categorizing ----------
  // Each category is matched against a game's Steam genres, store categories and
  // short description. A game can count toward more than one category.
  const CATEGORY_KEYWORDS = {
    Combat: ['action', 'shooter', 'fighting', 'combat', 'hack and slash', 'battle'],
    Exploration: ['adventure', 'open world', 'explor', 'survival', 'sandbox'],
    Story: ['rpg', 'story', 'narrative', 'visual novel'],
    Puzzle: ['puzzle', 'mystery', 'logic'],
    Horror: ['horror', 'zombie', 'terror', 'ghost'],
    Multiplayer: ['multi-player', 'multiplayer', 'co-op', 'pvp', 'mmo'],
  }
  const MAX_GAMES_TO_CATEGORIZE = 30 // most-played games only, to keep the import fast
  const storeCache = new Map() // appid -> Steam store data (rarely changes, so keep it while the server runs)

  async function storeDetails(appid) {
    if (!storeCache.has(appid)) {
      const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`
      const data = (await fetch(url, { signal: AbortSignal.timeout(6000) }).then((r) => r.json()).catch(() => null))?.[appid]?.data
      if (!data) return null // delisted game or network error: don't cache, so a retry can work
      storeCache.set(appid, data)
    }
    return storeCache.get(appid)
  }

  async function categorize(appid) {
    const data = await storeDetails(appid)
    if (!data) return []

    const text = [
      ...(data.genres ?? []).map((g) => g.description),
      ...(data.categories ?? []).map((c) => c.description),
      data.short_description ?? '',
    ].join(' ').toLowerCase()

    return Object.keys(CATEGORY_KEYWORDS).filter((cat) => CATEGORY_KEYWORDS[cat].some((k) => text.includes(k)))
  }

  // Details for the game popup. The browser can't call the Steam store directly (no CORS), so we pass it through.
  const decodeEntities = (s) =>
    s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

  app.get('/api/games/:appid', async (req, res) => {
    if (!/^\d+$/.test(req.params.appid)) return res.status(400).json({ error: 'Invalid app ID' })
    const data = await storeDetails(Number(req.params.appid))
    if (!data) return res.status(404).json({ error: 'Game not found on Steam' })
    res.json({
      description: decodeEntities(data.short_description ?? ''),
      genres: (data.genres ?? []).map((g) => g.description),
      developers: data.developers ?? [],
      releaseDate: data.release_date?.date ?? null,
    })
  })

  app.get('/api/steam/library', requireLogin, (req, res) => {
    const user = users[req.username]
    const connected = Boolean(user.steamId)
    res.json({ connected, library: connected ? user.steamLibrary ?? null : null })
  })

  app.post('/api/steam/import', requireLogin, async (req, res) => {
    const user = users[req.username]
    const steamId = user.steamId
    if (!steamId) return res.status(400).json({ error: 'Connect your Steam account first' })
    if (!STEAM_API_KEY) return res.status(500).json({ error: 'The server needs a Steam API key before it can import libraries.' })

    const ownedUrl = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/')
    ownedUrl.search = new URLSearchParams({
      key: STEAM_API_KEY,
      steamid: steamId,
      include_appinfo: '1',
      include_played_free_games: '1',
    })

    const ownedRes = await fetch(ownedUrl, { signal: AbortSignal.timeout(12_000) }).catch(() => null)
    if (!ownedRes) return res.status(502).json({ error: 'Couldn’t reach Steam. Try again in a moment.' })
    if (!ownedRes.ok) {
      return res.status(502).json({ error: 'Steam rejected the library request (HTTP ' + ownedRes.status + ').' })
    }

    const payload = await ownedRes.json().catch(() => null)
    const response = payload?.response
    if (!response) return res.status(502).json({ error: 'Steam returned an unexpected response. Try again.' })
    if (!Array.isArray(response.games) && response.game_count !== 0) {
      return res.status(400).json({ error: 'Steam didn’t share your library. Set Game Details to Public in your Steam profile, then try again.' })
    }

    const owned = new Map()
    for (const game of Array.isArray(response.games) ? response.games : []) {
      if (Number.isSafeInteger(game?.appid) && game.appid > 0) owned.set(game.appid, game)
    }
    const games = Array.from(owned.values(), (game) => ({
      appid: game.appid,
      title: typeof game.name === 'string' && game.name.trim() ? game.name.trim() : 'Steam game ' + game.appid,
    }))

    // Retain the categories used by Discover, based on the most-played games.
    const topGames = [...owned.values()]
      .sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
      .slice(0, MAX_GAMES_TO_CATEGORIZE)
    const counts = Object.fromEntries(Object.keys(CATEGORY_KEYWORDS).map((c) => [c, 0]))
    for (let i = 0; i < topGames.length; i += 5) {
      const batch = await Promise.all(topGames.slice(i, i + 5).map((game) => categorize(game.appid)))
      batch.flat().forEach((category) => counts[category]++)
    }

    if (user.steamId !== steamId) {
      return res.status(409).json({ error: 'Your linked Steam account changed. Reload the page before importing again.' })
    }

    const prefs = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)

    const library = { games }
    const nextUser = { ...user, steamLibrary: library, ownedAppIds: Array.from(owned.keys()) }
    if (prefs.length > 0) nextUser.prefs = prefs
    saveUsers({ ...users, [req.username]: nextUser })
    Object.assign(user, nextUser)
    res.json({ library, generalLibrary: libraryState(user).library, user: publicUser(req.username), counts, gameCount: games.length, analyzed: topGames.length })
  })

  // Last stop for unexpected errors (e.g. Steam unreachable): log it and answer with JSON.
  app.use((err, _req, res, _next) => {
    if (err instanceof CatalogError) return res.status(err.status).json({ error: err.message })
    console.error(err)
    res.status(500).json({ error: 'Something went wrong on the server. Check the server terminal for details.' })
  })

  return app
}

if (isMain) {
  const port = process.env.PORT ?? 3001
  createApp().listen(port, () => console.log(`API running on http://localhost:${port}`))
}
