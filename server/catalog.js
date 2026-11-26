import { Router } from 'express'
import { catalogGenres, consolePlatforms } from '../shared/platforms.js'

const PAGE_SIZE = 24
const CACHE_TIME = 10 * 60 * 1000
const MAX_CACHE_ENTRIES = 500
const sortOptions = new Set(['-added', 'name', '-released', '-rating'])

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
  const config = platformConfig(platform)
  if (!game || typeof game !== 'object') return null
  const supported = (Array.isArray(game.platforms) ? game.platforms : [])
    .map((entry) => config.consoles.find((console) => console.id === entry?.platform?.id))
    .filter(Boolean)
  if (!Number.isSafeInteger(game.id) || game.id < 1 || typeof game.name !== 'string' || !game.name.trim() || !supported.length) return null
  if (game.tba || (game.released && game.released > new Date().toISOString().slice(0, 10))) return null

  return {
    id: `${platform}:${game.id}`,
    catalogId: game.id,
    platform,
    title: game.name.trim(),
    imageUrl: typeof game.background_image === 'string' && game.background_image.startsWith('https://') ? game.background_image : null,
    genres: (Array.isArray(game.genres) ? game.genres : []).map((genre) => genre?.name).filter((name) => typeof name === 'string'),
    consoles: supported.map((console) => console.name),
    released: game.released ?? null,
    sourceUrl: `https://rawg.io/games/${encodeURIComponent(game.slug || game.id)}`,
  }
}

export function createCatalog({ apiKey, fetchImpl = globalThis.fetch } = {}) {
  const cache = new Map()
  const games = new Map()

  function remember(map, key, value) {
    if (map.size >= MAX_CACHE_ENTRIES) map.delete(map.keys().next().value)
    map.set(key, { value, expires: Date.now() + CACHE_TIME })
  }

  async function request(path, params = {}) {
    if (!apiKey) throw new CatalogError('The console game catalog is not available yet. Please try again later.', 503)
    const cacheKey = path + '?' + new URLSearchParams(params)
    const cached = cache.get(cacheKey)
    if (cached?.expires > Date.now()) return cached.value

    const url = new URL(`https://api.rawg.io/api/${path}`)
    url.search = new URLSearchParams({ ...params, key: apiKey })
    let response
    try {
      response = await fetchImpl(url, { signal: AbortSignal.timeout(10_000) })
    } catch {
      throw new CatalogError('Couldn’t reach the game catalog. Please try again.')
    }
    if (response.status === 404) throw new CatalogError('This game is no longer in the catalog.', 404)
    if (response.status === 429) throw new CatalogError('The game catalog is busy. Please try again in a moment.', 503)
    if (!response.ok) throw new CatalogError('The game catalog is temporarily unavailable. Please try again later.')
    const data = await response.json().catch(() => null)
    if (!data || typeof data !== 'object') throw new CatalogError('The game catalog returned an unexpected response. Please try again.')
    remember(cache, cacheKey, data)
    return data
  }

  async function list(platform, query = {}) {
    const config = platformConfig(platform)
    const { search = '', genre = '', console: consoleId = '', sort = '-added', page = '1' } = query
    if (typeof search !== 'string' || search.length > 120 ||
      (genre !== '' && !catalogGenres.some((item) => item.id === genre)) ||
      (consoleId !== '' && !config.consoles.some((item) => String(item.id) === consoleId)) ||
      !sortOptions.has(sort) || typeof page !== 'string' || !/^[1-9]\d{0,3}$/.test(page)) {
      throw new CatalogError('Choose valid catalog filters and a page number.', 400)
    }
    const params = {
      parent_platforms: config.parentId,
      page,
      page_size: PAGE_SIZE,
      ordering: sort,
      dates: `1900-01-01,${new Date().toISOString().slice(0, 10)}`,
      exclude_additions: 'true',
    }
    if (search.trim()) params.search = search.trim()
    if (genre) params.genres = genre
    if (consoleId) params.platforms = consoleId
    const data = await request('games', params)
    if (!Array.isArray(data.results) || !Number.isSafeInteger(data.count) || data.count < 0) {
      throw new CatalogError('The game catalog returned an unexpected response. Please try again.')
    }
    const results = data.results.map((game) => normalizeGame(game, platform)).filter(Boolean)
    for (const game of results) remember(games, game.id, game)
    return { games: results, count: data.count, page: Number(page), pageSize: PAGE_SIZE, hasNext: Boolean(data.next) }
  }

  async function getGames(platform, ids) {
    const config = platformConfig(platform)
    const results = []
    // Keep upstream requests bounded when adding multiple selections at once.
    for (let start = 0; start < ids.length; start += 5) {
      const batch = await Promise.all(ids.slice(start, start + 5).map(async (id) => {
        const cached = games.get(`${platform}:${id}`)
        if (cached?.expires > Date.now()) return cached.value
        const game = normalizeGame(await request(`games/${id}`), platform)
        if (!game || game.catalogId !== id) throw new CatalogError(`This game is not available on ${config.name}.`, 400)
        remember(games, game.id, game)
        return game
      }))
      results.push(...batch)
    }
    return results
  }

  return { list, getGames }
}

export function createCatalogRouter(catalog) {
  const router = Router()
  router.get('/:platform/games', async (req, res) => res.json(await catalog.list(req.params.platform, req.query)))
  return router
}
