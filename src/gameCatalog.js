import { games, genres } from './games.js'
import { nintendoGames } from './nintendoGames.js'

import { nintendoProducts } from './nintendoProducts.js'

export const platformLabels = { steam: 'Steam', nintendo: 'Nintendo Switch', switch2: 'Nintendo Switch 2' }
export const nintendoPlatforms = ['nintendo', 'switch2']
export const isNintendoGame = game => Boolean(game && nintendoPlatforms.some(platform => game.platforms.includes(platform)))
const withProducts = game => {
  const products = nintendoProducts[game.id] ?? {}
  return { ...game, products, platforms: [...(game.appid ? ['steam'] : []), ...nintendoPlatforms.filter(platform => products[platform])] }
}
export const catalog = [
  ...games.map(game => withProducts({ ...game, id: `steam:${game.appid}` })),
  ...nintendoGames.map(withProducts),
]
export const catalogById = new Map(catalog.map(game => [game.id, game]))
export const switchCatalog = catalog.filter(game => game.platforms.includes('nintendo'))
export const switch2Catalog = catalog.filter(game => game.platforms.includes('switch2'))
export const nintendoCatalog = catalog.filter(isNintendoGame)
export const nintendoStoreUrl = 'https://www.nintendo.com/us/store/games/nintendo-switch-games/'
export const getNintendoProduct = (game, platform) => game.products?.[platform] ?? game.products?.nintendo ?? game.products?.switch2

export function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function getOwnedIds(steamIds = [], nintendoEntries = []) {
  return new Set([...steamIds.map(id => `steam:${id}`), ...nintendoEntries.map(entry => entry.gameId)])
}

// Owned games contribute genre signals. A favorite counts twice; optional playtime
// gives a small capped bonus. Manual preferences stay intact and dominate ranking.
export function inferGenres(steamIds = [], nintendoEntries = []) {
  const weights = Object.fromEntries(genres.map(genre => [genre, 0]))
  const entries = new Map(nintendoEntries.map(entry => [entry.gameId, entry]))
  for (const id of getOwnedIds(steamIds, nintendoEntries)) {
    const game = catalogById.get(id)
    if (!game) continue
    const entry = entries.get(id)
    const weight = 1 + (entry?.favorite ? 1 : 0) + Math.min(1, (entry?.playtimeHours ?? 0) / 100)
    for (const tag of game.tags) weights[tag] += weight
  }
  return weights
}

export function recommendCatalog({ prefs = [], steamIds = [], nintendoEntries = [], platform = 'all' } = {}) {
  const owned = getOwnedIds(steamIds, nintendoEntries)
  const weights = inferGenres(steamIds, nintendoEntries)
  const maxWeight = Math.max(1, ...Object.values(weights))
  const score = game => {
    const manual = game.tags.filter(tag => prefs.includes(tag)).length
    const inferred = game.tags.reduce((total, tag) => total + (weights[tag] ?? 0) / maxWeight, 0)
    return manual * 10 + inferred
  }
  return catalog.filter(game => (platform === 'all' || game.platforms.includes(platform)) && !owned.has(game.id) && score(game) > 0)
    .sort((a, b) => score(b) - score(a))
}
