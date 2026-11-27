import { Router } from 'express'
import { catalogGenres, consolePlatforms } from '../shared/platforms.js'

const PAGE_SIZE = 24
const CACHE_TIME = 10 * 60 * 1000
const fields = 'id,name,slug,cover.image_id,platforms,genres.name,first_release_date'
const sortFields = { '-added': 'total_rating_count desc', name: 'name asc', '-released': 'first_release_date desc', '-rating': 'total_rating desc' }

export class CatalogError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.status = status
  }
}

function platformConfig(platform) {
  if (!Object.hasOwn(consolePlatforms, platform)) throw new CatalogError('Choose Xbox or PlayStation.', 400)
  return consolePlatforms[platform]
}

function normalizeGame(game, platform) {
  if (!game || !Number.isSafeInteger(game.id) || game.id < 1 || typeof game.name !== 'string' || !game.name.trim()) return null
  const supported = platformConfig(platform).consoles.filter((console) => game.platforms?.includes(console.id))
  if (!supported.length || !Number.isFinite(game.first_release_date) || game.first_release_date > Date.now() / 1000) return null
  const image = game.cover?.image_id
  return {
    id: `${platform}:igdb:${game.id}`, catalogId: game.id, provider: 'igdb', platform,
    title: game.name.trim(),
    imageUrl: typeof image === 'string' && /^[\w-]+$/.test(image) ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${image}.jpg` : null,
    genres: (game.genres ?? []).map((genre) => genre.name).filter((name) => typeof name === 'string'),
    consoles: supported.map((console) => console.name),
    released: new Date(game.first_release_date * 1000).toISOString().slice(0, 10),
    sourceUrl: `https://www.igdb.com/games/${encodeURIComponent(game.slug || game.id)}`,
  }
}

export function createCatalog({ clientId, clientSecret, fetchImpl = globalThis.fetch } = {}) {
  const cache = new Map()
  let token, tokenExpires = 0, tokenRequest
  let queue = Promise.resolve()
  let nextRequest = 0

  async function fetchResponse(url, options) {
    try { return await fetchImpl(url, { ...options, signal: AbortSignal.timeout(10_000) }) }
    catch { throw new CatalogError('Couldn’t reach the game catalog. Please try again.') }
  }

  async function getToken() {
    if (!clientId?.trim() || !clientSecret?.trim()) {
      throw new CatalogError('Xbox and PlayStation browsing needs Twitch credentials. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env, then restart the backend.', 503)
    }
    if (token && tokenExpires > Date.now()) return token
    if (!tokenRequest) tokenRequest = (async () => {
      const response = await fetchResponse('https://id.twitch.tv/oauth2/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: clientId.trim(), client_secret: clientSecret.trim(), grant_type: 'client_credentials' }).toString(),
      })
      if (!response.ok) throw new CatalogError('Couldn’t authenticate the game catalog. Check the backend’s Twitch client ID and secret.', 503)
      const data = await response.json().catch(() => null)
      if (typeof data?.access_token !== 'string' || !data.access_token || !Number.isFinite(data.expires_in) || data.expires_in <= 0) throw new CatalogError('The catalog authentication service returned an unexpected response.')
      token = data.access_token
      tokenExpires = Date.now() + Math.max(0, data.expires_in - 60) * 1000
      return token
    })().finally(() => { tokenRequest = null })
    return tokenRequest
  }

  function schedule(task) {
    const result = queue.then(async () => {
      const delay = nextRequest - Date.now()
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
      nextRequest = Date.now() + 260 // IGDB permits four requests per second.
      return task()
    })
    queue = result.catch(() => {})
    return result
  }

  async function request(path, body, retry = true) {
    const accessToken = await getToken()
    const response = await schedule(() => fetchResponse(`https://api.igdb.com/v4/${path}`, {
      method: 'POST', headers: { 'Client-ID': clientId.trim(), Authorization: `Bearer ${accessToken}`, 'Content-Type': 'text/plain', Accept: 'application/json' }, body,
    }))
    if (response.status === 401 && retry) {
      if (token === accessToken) { token = null; tokenExpires = 0 }
      return request(path, body, false)
    }
    if (response.status === 401 || response.status === 403) throw new CatalogError('Couldn’t authenticate the game catalog. Check the backend’s Twitch credentials.', 503)
    if (response.status === 429) throw new CatalogError('The game catalog is busy. Please try again in a moment.', 503)
    if (!response.ok) throw new CatalogError('The game catalog is temporarily unavailable. Please try again later.')
    const data = await response.json().catch(() => null)
    if (!Array.isArray(data)) throw new CatalogError('The game catalog returned an unexpected response. Please try again.')
    return data
  }

  async function list(platform, query = {}) {
    const config = platformConfig(platform)
    const { search = '', genre = '', console: consoleId = '', sort = '-added', page = '1' } = query
    const selectedGenre = catalogGenres.find((item) => item.id === genre)
    if (typeof search !== 'string' || search.length > 120 ||
      (genre !== '' && !selectedGenre) ||
      (consoleId !== '' && !config.consoles.some((item) => String(item.id) === consoleId)) ||
      !Object.hasOwn(sortFields, sort) || typeof page !== 'string' || !/^[1-9]\d{0,3}$/.test(page)) {
      throw new CatalogError('Choose valid catalog filters and a page number.', 400)
    }
    const ids = consoleId || config.consoles.map((console) => console.id).join(',')
    const filters = [`platforms = (${ids})`, `first_release_date <= ${Math.floor(Date.now() / 1000)}`, 'version_parent = null']
    if (search.trim()) filters.push(`name ~ *${JSON.stringify(search.trim())}*`)
    if (selectedGenre) filters.push(`genres = (${selectedGenre.igdbId})`)
    const where = `where ${filters.join(' & ')};`
    const body = `query games "games" { fields ${fields}; ${where} sort ${sortFields[sort]}; limit ${PAGE_SIZE}; offset ${(Number(page) - 1) * PAGE_SIZE}; }; query games/count "total" { ${where} };`
    const key = platform + body
    const cached = cache.get(key)
    if (cached?.expires > Date.now()) return cached.value
    const data = await request('multiquery', body)
    const rows = data.find((part) => part.name === 'games')?.result
    const count = data.find((part) => part.name === 'total')?.count
    if (!Array.isArray(rows) || !Number.isSafeInteger(count) || count < 0) throw new CatalogError('The game catalog returned an unexpected response. Please try again.')
    const result = { games: rows.map((game) => normalizeGame(game, platform)).filter(Boolean), count, page: Number(page), pageSize: PAGE_SIZE, hasNext: Number(page) * PAGE_SIZE < count }
    if (cache.size >= 500) cache.delete(cache.keys().next().value)
    cache.set(key, { value: result, expires: Date.now() + CACHE_TIME })
    return result
  }

  async function getGames(platform, ids) {
    const config = platformConfig(platform)
    const rows = await request('games', `fields ${fields}; where id = (${ids.join(',')}); limit 50;`)
    const games = new Map(rows.map((row) => [row.id, normalizeGame(row, platform)]))
    return ids.map((id) => {
      const game = games.get(id)
      if (!game) throw new CatalogError(`This game is not available on ${config.name}.`, 400)
      return game
    })
  }
  return { list, getGames }
}

export function createCatalogRouter(catalog) {
  const router = Router()
  router.get('/:platform/games', async (req, res) => res.json(await catalog.list(req.params.platform, req.query)))
  return router
}
