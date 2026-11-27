import { catalogById, isNintendoGame } from './gameCatalog.js'

const prefix = 'gamefinder:nintendo-library:v1:'
export const libraryEvent = 'gamefinder:nintendo-library-change'
export function libraryKey(user) {
  // Undefined means authentication is still loading; null means a guest.
  return user === undefined ? null : prefix + (user ? `account:${encodeURIComponent(user.username)}` : 'guest')
}

export function parseLibrary(raw) {
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    const unique = new Map()
    for (const entry of data) {
      if (!entry || !isNintendoGame(catalogById.get(entry.gameId))) continue
      const hours = entry.playtimeHours
      unique.set(entry.gameId, {
        gameId: entry.gameId,
        favorite: entry.favorite === true,
        playtimeHours: typeof hours === 'number' && Number.isFinite(hours) && hours >= 0 && hours <= 100000 ? hours : null,
      })
    }
    return [...unique.values()]
  } catch { return [] }
}

export function updateLibrary(raw, gameId, changes) {
  if (!isNintendoGame(catalogById.get(gameId))) throw new Error('Unknown Nintendo game.')
  const entries = parseLibrary(raw)
  if (changes === null) return entries.filter(entry => entry.gameId !== gameId)
  const current = entries.find(entry => entry.gameId === gameId)
  const next = { gameId, favorite: false, playtimeHours: null, ...current, ...changes, gameId }
  return parseLibrary(JSON.stringify([...entries.filter(entry => entry.gameId !== gameId), next]))
}
