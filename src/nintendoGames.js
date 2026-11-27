// Curated Nintendo Switch and Switch 2 starter catalog. These are GameFinder IDs, not Nintendo API IDs.
// The six tags deliberately match the existing Steam catalog's taxonomy.
import { nintendoProducts } from './nintendoProducts.js'

const entries = [
  ['zelda-botw', 'The Legend of Zelda: Breath of the Wild', 'Explore Hyrule, solve shrine puzzles and battle monsters.', ['Combat', 'Exploration', 'Puzzle']],
  ['zelda-totk', 'The Legend of Zelda: Tears of the Kingdom', 'Explore the skies and depths of Hyrule and build inventive contraptions.', ['Combat', 'Exploration', 'Puzzle']],
  ['mario-odyssey', 'Super Mario Odyssey', 'Travel through imaginative kingdoms in a 3D platforming adventure.', ['Exploration', 'Puzzle']],
  ['mario-kart-8', 'Mario Kart 8 Deluxe', 'Race with friends on colorful tracks.', ['Multiplayer']],
  ['animal-crossing', 'Animal Crossing: New Horizons', 'Build a peaceful island community and visit friends.', ['Exploration', 'Multiplayer']],
  ['smash-ultimate', 'Super Smash Bros. Ultimate', 'Battle with a huge roster of characters.', ['Combat', 'Multiplayer']],
  ['metroid-dread', 'Metroid Dread', 'Explore a hostile planet and evade relentless enemies.', ['Combat', 'Exploration', 'Horror']],
  ['kirby-forgotten', 'Kirby and the Forgotten Land', 'Explore a mysterious world in a colorful platforming adventure.', ['Combat', 'Exploration', 'Multiplayer']],
  ['luigis-mansion-3', "Luigi's Mansion 3", 'Investigate a haunted hotel and solve ghostly puzzles.', ['Puzzle', 'Exploration', 'Horror', 'Multiplayer']],
  ['pokemon-arceus', 'Pokemon Legends: Arceus', 'Explore the Hisui region and study wild Pokemon.', ['Exploration', 'Combat', 'Story']],
  ['pokemon-scarlet', 'Pokemon Scarlet', 'Travel across Paldea and build a team of Pokemon.', ['Exploration', 'Combat', 'Multiplayer']],
  ['pokemon-violet', 'Pokemon Violet', 'Discover Paldea and challenge other trainers.', ['Exploration', 'Combat', 'Multiplayer']],
  ['pokemon-diamond', 'Pokemon Brilliant Diamond', 'Journey through Sinnoh and train a team of Pokemon.', ['Combat', 'Exploration', 'Story']],
  ['pokemon-pearl', 'Pokemon Shining Pearl', 'Explore Sinnoh and take on gym challenges.', ['Combat', 'Exploration', 'Story']],
  ['pokemon-snap', 'New Pokemon Snap', 'Photograph Pokemon in their natural habitats.', ['Exploration', 'Puzzle']],
  ['splatoon-3', 'Splatoon 3', 'Compete in ink-filled team battles.', ['Combat', 'Multiplayer']],
  ['fire-emblem-three-houses', 'Fire Emblem: Three Houses', 'Lead students through tactical battles and a branching story.', ['Combat', 'Story']],
  ['fire-emblem-engage', 'Fire Emblem Engage', 'Command heroes in turn-based tactical battles.', ['Combat', 'Story']],
  ['pikmin-3', 'Pikmin 3 Deluxe', 'Guide a team of tiny creatures through exploration and puzzles.', ['Exploration', 'Puzzle', 'Multiplayer']],
  ['pikmin-4', 'Pikmin 4', 'Rescue stranded explorers with the help of Pikmin.', ['Exploration', 'Puzzle']],
  ['zelda-links-awakening', "The Legend of Zelda: Link's Awakening", 'Explore a mysterious island and its puzzle-filled dungeons.', ['Exploration', 'Puzzle', 'Combat']],
  ['zelda-skyward-sword', 'The Legend of Zelda: Skyward Sword HD', 'Journey between sky islands and the surface world.', ['Exploration', 'Puzzle', 'Combat', 'Story']],
  ['mario-maker-2', 'Super Mario Maker 2', 'Create and play inventive Mario courses.', ['Puzzle', 'Multiplayer']],
  ['mario-party-superstars', 'Mario Party Superstars', 'Play board games and minigames with friends.', ['Multiplayer', 'Puzzle']],
  ['mario-3d-world', "Super Mario 3D World + Bowser's Fury", 'Explore colorful platforming levels alone or together.', ['Exploration', 'Multiplayer']],
  ['paper-mario-origami', 'Paper Mario: The Origami King', 'Unfold a paper world with puzzles and battles.', ['Story', 'Puzzle', 'Combat']],
  ['yoshi-crafted', "Yoshi's Crafted World", 'Explore handmade worlds and uncover hidden collectibles.', ['Exploration', 'Puzzle', 'Multiplayer']],
  ['hyrule-warriors', 'Hyrule Warriors: Age of Calamity', 'Fight large-scale battles in a story set in Hyrule.', ['Combat', 'Story', 'Multiplayer']],
  ['miitopia', 'Miitopia', 'Create a cast of Mii heroes for a whimsical role-playing adventure.', ['Story', 'Combat']],
  ['clubhouse-games', 'Clubhouse Games: 51 Worldwide Classics', 'Play a collection of board, card and tabletop games.', ['Puzzle', 'Multiplayer']],
  ['captain-toad', 'Captain Toad: Treasure Tracker', 'Navigate miniature puzzle worlds to find treasure.', ['Puzzle', 'Exploration']],
  ['metroid-prime', 'Metroid Prime Remastered', 'Explore Tallon IV in a first-person sci-fi adventure.', ['Combat', 'Exploration']],
  ['famicom-missing-heir', 'Famicom Detective Club: The Missing Heir', 'Investigate a mysterious death and uncover family secrets.', ['Story', 'Puzzle', 'Horror']],
  ['famicom-girl', 'Famicom Detective Club: The Girl Who Stands Behind', 'Investigate a school mystery with an unsettling legend.', ['Story', 'Puzzle', 'Horror']],
]

entries.push(
  ['mario-kart-world', 'Mario Kart World', 'Race across an interconnected world with friends.', ['Exploration', 'Multiplayer']],
  ['donkey-kong-bananza', 'Donkey Kong Bananza', 'Smash through underground worlds on a platforming adventure.', ['Combat', 'Exploration']],
  ['kirby-air-riders', 'Kirby Air Riders', 'Race and battle on flying machines.', ['Combat', 'Multiplayer']],
  ['hyrule-imprisonment', 'Hyrule Warriors: Age of Imprisonment', 'Fight large-scale battles in the ancient kingdom of Hyrule.', ['Combat', 'Story']],
  ['pokemon-pokopia', 'Pokemon Pokopia', 'Create habitats and befriend Pokemon in a cozy world.', ['Exploration', 'Puzzle']],
  ['mario-tennis-fever', 'Mario Tennis Fever', 'Compete in colorful tennis matches.', ['Multiplayer']],
  ['drag-x-drive', 'Drag x Drive', 'Play fast-paced team wheelchair basketball.', ['Multiplayer']],
  ['pokemon-za', 'Pokemon Legends: Z-A', 'Explore Lumiose City and battle Pokemon in real time.', ['Combat', 'Exploration', 'Story']],
  ['metroid-prime-4', 'Metroid Prime 4: Beyond', 'Explore a mysterious planet in a first-person adventure.', ['Combat', 'Exploration', 'Puzzle']],
)

export const nintendoGames = entries.map(([slug, title, description, tags]) => ({
  id: `nintendo:${slug}`, title, description, tags,
  platforms: Object.keys(nintendoProducts[`nintendo:${slug}`] ?? {}), color: 'from-red-700 to-stone-900',
}))

// Known Switch versions of titles already in the supplied Steam catalog.
// Preserve their Steam-based canonical IDs to avoid duplicate recommendations.
export const switchSteamAppIds = new Set([
  1145360, 753640, 264710, 275850, 383870, 620, 292030,
  736260, 653530, 238320, 632470, 1426210, 367520, 391540, 501300,
  319630, 504230, 1057090, 400, 257510, 304430, 1049410, 553420,
  728880, 1092790, 424840, 57300, 214490, 1262350, 381210, 252950,
  945360, 632360, 105600,
])
