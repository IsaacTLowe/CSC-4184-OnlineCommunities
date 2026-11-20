// Minimal backend: username/password accounts, optional Steam sign-in,
// and a Steam library import that turns owned games into 3 preferences.
import express from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'

// Load STEAM_API_KEY etc. from .env if the file exists (works on Node 20.12+).
if (fs.existsSync('.env')) process.loadEnvFile('.env')

const PORT = process.env.PORT ?? 3001
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173' // where the browser sees the app
const STEAM_API_KEY = process.env.STEAM_API_KEY
const DB_FILE = new URL('./data/users.json', import.meta.url)

// ---------- storage: a JSON file is enough for a class project ----------
const users = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : {}
const saveUsers = () => {
  fs.mkdirSync(new URL('./data/', import.meta.url), { recursive: true })
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2))
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

  users[req.username].steamId = steamId
  saveUsers()
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
    const data = (await fetch(url).then((r) => r.json()).catch(() => null))?.[appid]?.data
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

app.post('/api/steam/import', requireLogin, async (req, res) => {
  const user = users[req.username]
  if (!user.steamId) return res.status(400).json({ error: 'Connect your Steam account first' })
  if (!STEAM_API_KEY) return res.status(500).json({ error: 'Server is missing STEAM_API_KEY' })

  const ownedUrl =
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}` +
    `&steamid=${user.steamId}&include_appinfo=1&include_played_free_games=1`
  const ownedRes = await fetch(ownedUrl)
  if (!ownedRes.ok) {
    return res.status(502).json({ error: `Steam rejected the request (HTTP ${ownedRes.status}). Check STEAM_API_KEY in .env.` })
  }
  const owned = (await ownedRes.json()).response?.games ?? []
  if (owned.length === 0) {
    return res.status(400).json({ error: 'No games found. Make sure your Steam profile\'s "Game details" are set to Public.' })
  }

  // Count categories across the most-played games, 5 store requests at a time.
  const topGames = [...owned].sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, MAX_GAMES_TO_CATEGORIZE)
  const counts = Object.fromEntries(Object.keys(CATEGORY_KEYWORDS).map((c) => [c, 0]))
  for (let i = 0; i < topGames.length; i += 5) {
    const batch = await Promise.all(topGames.slice(i, i + 5).map((g) => categorize(g.appid)))
    batch.flat().forEach((cat) => counts[cat]++)
  }

  // The 3 most common categories become the user's preferences.
  const prefs = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat)

  if (prefs.length > 0) user.prefs = prefs
  user.ownedAppIds = owned.map((g) => g.appid)
  saveUsers()
  res.json({ user: publicUser(req.username), counts, gameCount: owned.length, analyzed: topGames.length })
})

// Last stop for unexpected errors (e.g. Steam unreachable): log it and answer with JSON.
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server. Check the server terminal for details.' })
})

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
