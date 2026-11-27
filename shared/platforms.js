export const platformNames = { steam: 'Steam', xbox: 'Xbox', playstation: 'PlayStation' }

// IGDB's console IDs cover every generation, including handhelds.
export const consolePlatforms = {
  xbox: {
    name: 'Xbox',
    consoles: [
      { id: 169, name: 'Xbox Series X|S' },
      { id: 49, name: 'Xbox One' },
      { id: 12, name: 'Xbox 360' },
      { id: 11, name: 'Xbox' },
    ],
  },
  playstation: {
    name: 'PlayStation',
    consoles: [
      { id: 167, name: 'PlayStation 5' },
      { id: 48, name: 'PlayStation 4' },
      { id: 9, name: 'PlayStation 3' },
      { id: 8, name: 'PlayStation 2' },
      { id: 7, name: 'PlayStation' },
      { id: 46, name: 'PS Vita' },
      { id: 38, name: 'PSP' },
    ],
  },
}

export const catalogGenres = [
  ['adventure', 'Adventure', 31], ['arcade', 'Arcade', 33], ['card', 'Card & board games', 35],
  ['fighting', 'Fighting', 4], ['hack-and-slash', 'Hack and slash', 25], ['indie', 'Indie', 32],
  ['music', 'Music', 7], ['platformer', 'Platformer', 8], ['point-and-click', 'Point and click', 2],
  ['puzzle', 'Puzzle', 9], ['quiz', 'Quiz', 26], ['racing', 'Racing', 10],
  ['role-playing-games-rpg', 'RPG', 12], ['shooter', 'Shooter', 5], ['simulation', 'Simulation', 13],
  ['sports', 'Sports', 14], ['strategy', 'Strategy', 15], ['tactical', 'Tactical', 24],
  ['turn-based', 'Turn-based strategy', 16], ['real-time-strategy', 'Real-time strategy', 11],
  ['visual-novel', 'Visual novel', 34], ['pinball', 'Pinball', 30], ['moba', 'MOBA', 36],
].map(([id, name, igdbId]) => ({ id, name, igdbId }))
