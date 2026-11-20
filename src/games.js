// Shared game catalog. `appid` is the game's Steam app ID: it gives us the
// real cover image and lets us skip games the user already owns.
export const genres = ['Combat', 'Exploration', 'Story', 'Puzzle', 'Horror', 'Multiplayer']

export const coverUrl = (appid) => `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`

export const games = [
  { appid: 1245620, title: 'Elden Ring', description: 'Explore a vast dark fantasy world full of tough bosses.', tags: ['Combat', 'Exploration'], color: 'from-amber-400 to-orange-600' },
  { appid: 782330, title: 'DOOM Eternal', description: 'Fast, brutal shooting against hordes of demons.', tags: ['Combat'], color: 'from-red-500 to-rose-700' },
  { appid: 1145360, title: 'Hades', description: 'Fight your way out of the underworld, one run at a time.', tags: ['Combat', 'Story'], color: 'from-rose-400 to-red-600' },
  { appid: 753640, title: 'Outer Wilds', description: 'Uncover the mystery of a solar system stuck in a time loop.', tags: ['Exploration', 'Puzzle'], color: 'from-sky-400 to-indigo-600' },
  { appid: 264710, title: 'Subnautica', description: 'Survive and explore an alien ocean planet.', tags: ['Exploration'], color: 'from-cyan-400 to-blue-600' },
  { appid: 275850, title: 'No Man\'s Sky', description: 'Fly between endless planets with friends.', tags: ['Exploration', 'Multiplayer'], color: 'from-violet-400 to-fuchsia-600' },
  { appid: 383870, title: 'Firewatch', description: 'A quiet mystery in the Wyoming wilderness.', tags: ['Exploration', 'Story'], color: 'from-orange-300 to-amber-600' },
  { appid: 620, title: 'Portal 2', description: 'Solve mind-bending portal puzzles solo or in co-op.', tags: ['Puzzle', 'Multiplayer'], color: 'from-slate-400 to-slate-600' },
  { appid: 2050650, title: 'Resident Evil 4', description: 'Survival horror with intense action in a hostile village.', tags: ['Horror', 'Combat'], color: 'from-stone-500 to-stone-800' },
  { appid: 1172470, title: 'Apex Legends', description: 'Team-based battle royale with unique heroes.', tags: ['Combat', 'Multiplayer'], color: 'from-red-400 to-orange-500' },
  { appid: 292030, title: 'The Witcher 3', description: 'Hunt monsters across a huge story-driven open world.', tags: ['Story', 'Combat', 'Exploration'], color: 'from-emerald-400 to-teal-700' },
  { appid: 739630, title: 'Phasmophobia', description: 'Investigate haunted places with friends.', tags: ['Horror', 'Multiplayer'], color: 'from-indigo-700 to-slate-900' },
  // Added so every category has a few picks left after owned games are filtered out.
  { appid: 210970, title: 'The Witness', description: 'Solve hundreds of line puzzles on a mysterious island.', tags: ['Puzzle', 'Exploration'], color: 'from-lime-400 to-emerald-600' },
  { appid: 736260, title: 'Baba Is You', description: 'Push the rules themselves to change how each level works.', tags: ['Puzzle'], color: 'from-pink-400 to-rose-600' },
  { appid: 653530, title: 'Return of the Obra Dinn', description: 'Deduce the fate of a lost ship\'s crew.', tags: ['Puzzle', 'Story'], color: 'from-stone-300 to-stone-600' },
  { appid: 1693980, title: 'Dead Space', description: 'Fight to survive aboard a derelict mining ship.', tags: ['Horror', 'Combat'], color: 'from-zinc-600 to-zinc-900' },
  { appid: 238320, title: 'Outlast', description: 'Hide and run through an asylum with only a camcorder.', tags: ['Horror', 'Story'], color: 'from-neutral-600 to-neutral-900' },
  { appid: 1966720, title: 'Lethal Company', description: 'Scavenge abandoned moons with friends, and try not to die.', tags: ['Horror', 'Multiplayer'], color: 'from-yellow-600 to-stone-800' },
  { appid: 632470, title: 'Disco Elysium', description: 'A detective RPG driven by dialogue and choices.', tags: ['Story'], color: 'from-teal-500 to-cyan-800' },
  { appid: 1174180, title: 'Red Dead Redemption 2', description: 'An outlaw\'s story across a living open world.', tags: ['Story', 'Exploration', 'Combat'], color: 'from-red-700 to-amber-800' },
  { appid: 548430, title: 'Deep Rock Galactic', description: 'Co-op mining and bug-blasting deep underground.', tags: ['Multiplayer', 'Combat'], color: 'from-amber-500 to-yellow-700' },
  { appid: 1426210, title: 'It Takes Two', description: 'A co-op adventure built entirely for two players.', tags: ['Multiplayer', 'Story', 'Puzzle'], color: 'from-fuchsia-400 to-purple-600' },
  { appid: 814380, title: 'Sekiro: Shadows Die Twice', description: 'Precise sword combat in a war-torn Japan.', tags: ['Combat'], color: 'from-red-600 to-neutral-800' },
  { appid: 367520, title: 'Hollow Knight', description: 'Explore a ruined bug kingdom full of secrets.', tags: ['Exploration', 'Combat'], color: 'from-slate-500 to-indigo-900' },

  // Story
  { appid: 1086940, title: 'Baldur\'s Gate 3', description: 'A huge party-based RPG where every choice reshapes the story.', tags: ['Story', 'Combat'], color: 'from-amber-600 to-red-900' },
  { appid: 1091500, title: 'Cyberpunk 2077', description: 'Carve your own path through a neon-soaked megacity.', tags: ['Story', 'Combat', 'Exploration'], color: 'from-yellow-400 to-cyan-600' },
  { appid: 1593500, title: 'God of War', description: 'Kratos and his son journey through the realms of Norse myth.', tags: ['Combat', 'Story'], color: 'from-red-500 to-slate-700' },
  { appid: 1328670, title: 'Mass Effect Legendary Edition', description: 'Lead a squad through a galaxy-spanning sci-fi trilogy.', tags: ['Story', 'Combat'], color: 'from-blue-500 to-slate-800' },
  { appid: 391540, title: 'Undertale', description: 'An RPG where nobody has to die, and the monsters remember.', tags: ['Story', 'Puzzle'], color: 'from-neutral-700 to-black' },
  { appid: 501300, title: 'What Remains of Edith Finch', description: 'Explore a strange house and the stories of a cursed family.', tags: ['Story', 'Exploration'], color: 'from-emerald-500 to-sky-700' },
  { appid: 319630, title: 'Life is Strange', description: 'Rewind time to change choices in a small-town mystery.', tags: ['Story', 'Puzzle'], color: 'from-orange-300 to-sky-500' },
  { appid: 504230, title: 'Celeste', description: 'Climb a mountain in a tough, heartfelt platformer.', tags: ['Story'], color: 'from-pink-400 to-violet-700' },
  { appid: 1057090, title: 'Ori and the Will of the Wisps', description: 'A gorgeous platforming adventure through a living forest.', tags: ['Exploration', 'Story'], color: 'from-sky-300 to-indigo-700' },

  // Puzzle
  { appid: 400, title: 'Portal', description: 'The original portal-gun puzzler, with a very polite AI.', tags: ['Puzzle'], color: 'from-orange-400 to-sky-500' },
  { appid: 257510, title: 'The Talos Principle', description: 'Solve logic puzzles while questioning what it means to be human.', tags: ['Puzzle', 'Exploration'], color: 'from-amber-200 to-stone-500' },
  { appid: 304430, title: 'Inside', description: 'A dark, wordless puzzle-platformer full of unsettling secrets.', tags: ['Puzzle', 'Story'], color: 'from-gray-400 to-gray-800' },
  { appid: 1049410, title: 'Superliminal', description: 'Change objects\' size just by changing your perspective.', tags: ['Puzzle'], color: 'from-indigo-300 to-purple-600' },
  { appid: 1260520, title: 'Patrick\'s Parabox', description: 'Push boxes inside boxes inside boxes, recursively.', tags: ['Puzzle'], color: 'from-teal-300 to-blue-600' },
  { appid: 558990, title: 'Opus Magnum', description: 'Design alchemical machines and optimize your solutions.', tags: ['Puzzle'], color: 'from-yellow-600 to-amber-900' },
  { appid: 553420, title: 'Tunic', description: 'A tiny fox explores a big world full of hidden secrets.', tags: ['Exploration', 'Puzzle', 'Combat'], color: 'from-lime-300 to-teal-600' },
  { appid: 728880, title: 'Overcooked! 2', description: 'Chaotic co-op cooking where teamwork is everything.', tags: ['Multiplayer', 'Puzzle'], color: 'from-red-400 to-yellow-500' },

  // Horror
  { appid: 1092790, title: 'Inscryption', description: 'A creepy card game that keeps changing the rules.', tags: ['Horror', 'Puzzle', 'Story'], color: 'from-amber-800 to-stone-900' },
  { appid: 424840, title: 'Little Nightmares', description: 'Escape a hungry, nightmarish vessel as a tiny child.', tags: ['Horror', 'Puzzle'], color: 'from-yellow-500 to-neutral-900' },
  { appid: 57300, title: 'Amnesia: The Dark Descent', description: 'Hide, don\'t fight, in a castle full of horrors.', tags: ['Horror', 'Puzzle'], color: 'from-stone-600 to-black' },
  { appid: 282140, title: 'SOMA', description: 'Sci-fi horror at the bottom of the ocean.', tags: ['Horror', 'Story', 'Exploration'], color: 'from-cyan-700 to-slate-950' },
  { appid: 214490, title: 'Alien: Isolation', description: 'Survive a space station hunted by a single, relentless alien.', tags: ['Horror'], color: 'from-green-700 to-zinc-900' },
  { appid: 883710, title: 'Resident Evil 2', description: 'Escape a zombie-filled Raccoon City in this classic remake.', tags: ['Horror', 'Combat'], color: 'from-red-800 to-neutral-900' },
  { appid: 1262350, title: 'Signalis', description: 'Retro survival horror in a dystopian sci-fi future.', tags: ['Horror', 'Story'], color: 'from-red-600 to-zinc-800' },
  { appid: 381210, title: 'Dead by Daylight', description: 'Four survivors try to escape one killer.', tags: ['Horror', 'Multiplayer'], color: 'from-red-900 to-black' },
  { appid: 2881650, title: 'Content Warning', description: 'Film spooky things with friends to go viral.', tags: ['Horror', 'Multiplayer'], color: 'from-lime-500 to-stone-800' },

  // Multiplayer
  { appid: 550, title: 'Left 4 Dead 2', description: 'Four-player co-op against hordes of zombies.', tags: ['Multiplayer', 'Combat', 'Horror'], color: 'from-red-600 to-stone-900' },
  { appid: 553850, title: 'Helldivers 2', description: 'Spread managed democracy in chaotic co-op battles.', tags: ['Multiplayer', 'Combat'], color: 'from-yellow-400 to-zinc-800' },
  { appid: 252950, title: 'Rocket League', description: 'Soccer, but with rocket-powered cars.', tags: ['Multiplayer'], color: 'from-blue-500 to-orange-500' },
  { appid: 945360, title: 'Among Us', description: 'Find the impostor before they take out the crew.', tags: ['Multiplayer'], color: 'from-red-500 to-cyan-600' },
  { appid: 1172620, title: 'Sea of Thieves', description: 'Sail, plunder and explore as a crew of pirates.', tags: ['Multiplayer', 'Exploration'], color: 'from-teal-400 to-blue-800' },
  { appid: 322330, title: 'Don\'t Starve Together', description: 'Survive a strange, hostile wilderness with friends.', tags: ['Multiplayer', 'Exploration'], color: 'from-stone-500 to-amber-900' },
  { appid: 632360, title: 'Risk of Rain 2', description: 'A co-op roguelike shooter that gets harder by the minute.', tags: ['Multiplayer', 'Combat'], color: 'from-violet-500 to-sky-800' },
  { appid: 105600, title: 'Terraria', description: 'Dig, build and fight across a 2D sandbox world.', tags: ['Exploration', 'Multiplayer', 'Combat'], color: 'from-green-500 to-sky-600' },
  { appid: 892970, title: 'Valheim', description: 'Survive and build in a Viking purgatory with friends.', tags: ['Exploration', 'Multiplayer', 'Combat'], color: 'from-emerald-700 to-slate-800' },

  // Combat
  { appid: 374320, title: 'Dark Souls III', description: 'Brutal, rewarding combat in a dying kingdom.', tags: ['Combat', 'Exploration'], color: 'from-orange-700 to-neutral-900' },
]

// Rank catalog games by how many of the user's preferred categories they hit,
// skipping anything already in the user's Steam library.
export function recommend(prefs, ownedAppIds = []) {
  const score = (game) => game.tags.filter((t) => prefs.includes(t)).length
  return games
    .filter((g) => score(g) > 0 && !ownedAppIds.includes(g.appid))
    .sort((a, b) => score(b) - score(a))
}
