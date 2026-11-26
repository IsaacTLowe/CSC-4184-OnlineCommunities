export const platformNames = { steam: 'Steam', xbox: 'Xbox', playstation: 'PlayStation' }

// RAWG's platform families cover every generation, including handhelds.
export const consolePlatforms = {
  xbox: {
    name: 'Xbox',
    parentId: 3,
    consoles: [
      { id: 186, name: 'Xbox Series X|S' },
      { id: 1, name: 'Xbox One' },
      { id: 14, name: 'Xbox 360' },
      { id: 80, name: 'Xbox' },
    ],
  },
  playstation: {
    name: 'PlayStation',
    parentId: 2,
    consoles: [
      { id: 187, name: 'PlayStation 5' },
      { id: 18, name: 'PlayStation 4' },
      { id: 16, name: 'PlayStation 3' },
      { id: 15, name: 'PlayStation 2' },
      { id: 27, name: 'PlayStation' },
      { id: 19, name: 'PS Vita' },
      { id: 17, name: 'PSP' },
    ],
  },
}

export const catalogGenres = [
  ['action', 'Action'], ['adventure', 'Adventure'], ['arcade', 'Arcade'],
  ['board-games', 'Board games'], ['card', 'Card'], ['casual', 'Casual'],
  ['educational', 'Educational'], ['family', 'Family'], ['fighting', 'Fighting'],
  ['indie', 'Indie'], ['massively-multiplayer', 'Massively multiplayer'],
  ['platformer', 'Platformer'], ['puzzle', 'Puzzle'], ['racing', 'Racing'],
  ['role-playing-games-rpg', 'RPG'], ['shooter', 'Shooter'], ['simulation', 'Simulation'],
  ['sports', 'Sports'], ['strategy', 'Strategy'],
].map(([id, name]) => ({ id, name }))
