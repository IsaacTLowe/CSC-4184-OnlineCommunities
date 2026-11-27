import { Router } from 'express'
import { consolePlatforms } from '../shared/platforms.js'

export function libraryState(user) {
  const connected = Boolean(user.steamId)
  const imported = connected && Array.isArray(user.steamLibrary?.games)
  const steamGames = imported ? user.steamLibrary.games.map((game) => ({
    ...game,
    id: `steam:${game.appid}`,
    platform: 'steam',
    imageUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
    genres: [],
  })) : []
  return {
    library: { games: [...steamGames, ...(user.consoleGames ?? [])] },
    steam: { connected, imported },
  }
}

export function createLibraryRouter({ users, saveUsers, catalog }) {
  const router = Router()
  router.get('/', (req, res) => res.json(libraryState(users[req.username])))

  router.use('/:platform', (req, res, next) => {
    if (!Object.hasOwn(consolePlatforms, req.params.platform)) return res.status(400).json({ error: 'Choose Xbox or PlayStation.' })
    next()
  })

  function saveLibrary(username, consoleGames) {
    const user = users[username]
    const nextUser = { ...user, consoleGames }
    saveUsers({ ...users, [username]: nextUser })
    Object.assign(user, nextUser)
  }

  router.post('/:platform/games', async (req, res) => {
    const ids = req.body?.gameIds
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50 || !ids.every((id) => Number.isSafeInteger(id) && id > 0)) {
      return res.status(400).json({ error: 'Select between 1 and 50 games from the catalog.' })
    }
    const selectedGames = await catalog.getGames(req.params.platform, [...new Set(ids)])
    // Read the current collection after catalog requests finish, so concurrent
    // additions and Steam imports cannot overwrite each other's saved games.
    const currentGames = users[req.username].consoleGames ?? []
    const owned = new Set(currentGames.map((game) => game.id))
    const addedAt = new Date().toISOString()
    const legacyTitles = new Set(currentGames.filter((game) => !game.provider).map((game) => game.platform + ':' + game.title.normalize('NFKC').toLowerCase()))
    const newGames = selectedGames.filter((game) => !owned.has(game.id) && !legacyTitles.has(game.platform + ':' + game.title.normalize('NFKC').toLowerCase())).map((game) => ({ ...game, addedAt }))
    if (newGames.length) saveLibrary(req.username, [...currentGames, ...newGames])
    res.status(newGames.length ? 201 : 200).json({ ...libraryState(users[req.username]), addedCount: newGames.length })
  })

  router.delete('/:platform/games/:gameId', (req, res) => {
    if (!/^(?:igdb:)?[1-9]\d*$/.test(req.params.gameId) || !Number.isSafeInteger(Number(req.params.gameId.replace(/^igdb:/, '')))) {
      return res.status(400).json({ error: 'Invalid game ID.' })
    }
    const id = `${req.params.platform}:${req.params.gameId}`
    const currentGames = users[req.username].consoleGames ?? []
    const nextGames = currentGames.filter((game) => game.id !== id)
    if (currentGames.length !== nextGames.length) saveLibrary(req.username, nextGames)
    res.json(libraryState(users[req.username]))
  })

  return router
}
