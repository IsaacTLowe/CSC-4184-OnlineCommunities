import { useState } from 'react'

const card = 'rounded-3xl border border-[#392525]/10 bg-[#FAF5E9] shadow-xl shadow-[#392525]/5'

const button =
  'inline-flex items-center justify-center rounded-xl bg-[#392525] px-6 py-3 font-semibold text-[#FAF5E9] shadow-sm transition hover:bg-[#392525]/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#392525]'

const secondaryButton =
  'inline-flex items-center justify-center rounded-xl border border-[#392525]/20 bg-[#FAF5E9] px-6 py-3 font-semibold text-[#392525] shadow-sm transition hover:bg-[#392525]/5'

const genres = ['Combat', 'Exploration', 'Story', 'Puzzle', 'Horror', 'Multiplayer']

const games = [
  { title: 'Elden Ring', description: 'Explore a vast dark fantasy world full of tough bosses.', tags: ['Combat', 'Exploration'], color: 'from-amber-400 to-orange-600' },
  { title: 'DOOM Eternal', description: 'Fast, brutal shooting against hordes of demons.', tags: ['Combat'], color: 'from-red-500 to-rose-700' },
  { title: 'Hades', description: 'Fight your way out of the underworld, one run at a time.', tags: ['Combat', 'Story'], color: 'from-rose-400 to-red-600' },
  { title: 'Outer Wilds', description: 'Uncover the mystery of a solar system stuck in a time loop.', tags: ['Exploration', 'Puzzle'], color: 'from-sky-400 to-indigo-600' },
  { title: 'Subnautica', description: 'Survive and explore an alien ocean planet.', tags: ['Exploration'], color: 'from-cyan-400 to-blue-600' },
  { title: 'No Man\'s Sky', description: 'Fly between endless planets with friends.', tags: ['Exploration', 'Multiplayer'], color: 'from-violet-400 to-fuchsia-600' },
  { title: 'Firewatch', description: 'A quiet mystery in the Wyoming wilderness.', tags: ['Exploration', 'Story'], color: 'from-orange-300 to-amber-600' },
  { title: 'Portal 2', description: 'Solve mind-bending portal puzzles solo or in co-op.', tags: ['Puzzle', 'Multiplayer'], color: 'from-slate-400 to-slate-600' },
  { title: 'Resident Evil 4', description: 'Survival horror with intense action in a hostile village.', tags: ['Horror', 'Combat'], color: 'from-stone-500 to-stone-800' },
  { title: 'Apex Legends', description: 'Team-based battle royale with unique heroes.', tags: ['Combat', 'Multiplayer'], color: 'from-red-400 to-orange-500' },
  { title: 'The Witcher 3', description: 'Hunt monsters across a huge story-driven open world.', tags: ['Story', 'Combat', 'Exploration'], color: 'from-emerald-400 to-teal-700' },
  { title: 'Phasmophobia', description: 'Investigate haunted places with friends.', tags: ['Horror', 'Multiplayer'], color: 'from-indigo-700 to-slate-900' },
]

export default function HomePage({ initialScreen = 'home' }) {
  const [screen, setScreen] = useState(initialScreen)
  const [prefs, setPrefs] = useState(() => JSON.parse(localStorage.getItem('prefs')) ?? ['Combat'])

  function savePrefs(next) {
    localStorage.setItem('prefs', JSON.stringify(next))
    setPrefs(next)
    setScreen('saved')
  }

  return (
    <div className="flex flex-1 flex-col bg-[#FAF5E9] text-[#392525]">
      <main className="flex flex-1 justify-center px-4 py-12">
        {screen === 'home' && <Home prefs={prefs} onAdjust={() => setScreen('prefs')} />}
        {screen === 'prefs' && (
          <Preferences prefs={prefs} onBack={() => setScreen('home')} onSave={savePrefs} />
        )}
        {screen === 'saved' && <Saved onHome={() => setScreen('home')} />}
      </main>
    </div>
  )
}

function Home({ prefs, onAdjust }) {
  const [query, setQuery] = useState('')

  const score = (game) => game.tags.filter((t) => prefs.includes(t)).length
  const searching = query.trim() !== ''
  const results = searching
    ? games.filter((g) => `${g.title} ${g.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
    : games.filter((g) => score(g) > 0).sort((a, b) => score(b) - score(a))

  return (
    <div className="w-full max-w-5xl">
      <div className="relative mx-auto max-w-2xl">
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#392525]/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          className="w-full rounded-2xl border border-[#392525]/20 bg-[#FAF5E9] py-4 pr-4 pl-12 text-[#392525] shadow-sm placeholder:text-[#392525]/60 transition focus:border-[#392525] focus:ring-4 focus:ring-[#392525]/15 focus:outline-none"
          type="search"
          placeholder="Search games or genres..."
          aria-label="Search games"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <h1 className="mt-10 text-3xl font-bold tracking-tight">{searching ? 'Search Results' : 'Recommended for You'}</h1>
      {searching ? (
        <p className="mt-1 text-[#392525]/70">{`${results.length} games match "${query.trim()}"`}</p>
      ) : (
        <div className="mt-1 flex items-center gap-2 text-[#392525]/70">
          <p>Based on your preferences: {prefs.join(', ')}</p>
          <button
            className="flex size-6 items-center justify-center rounded-full border border-[#392525] text-[#392525] transition hover:bg-[#392525]/5"
            type="button"
            aria-label="Adjust preferences"
            title="Adjust preferences"
            onClick={onAdjust}
          >
            <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        </div>
      )}

      {results.length === 0 ? (
        <p className={`${card} mt-6 p-10 text-center text-[#392525]/70`}>No games found. Try a different search.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((game) => (
            <GameCard key={game.title} game={game} prefs={prefs} />
          ))}
        </div>
      )}
    </div>
  )
}

function GameCard({ game, prefs }) {
  return (
    <div>
      <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br shadow-sm ${game.color}`} />
      <h2 className="mt-3 font-bold">{game.title}</h2>
      <p className="mt-1 text-sm text-[#392525]/70">{game.description}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {game.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${prefs.includes(tag) ? 'bg-[#392525]/10 text-[#392525]' : 'bg-[#392525]/5 text-[#392525]/70'}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function Preferences({ prefs, onBack, onSave }) {
  const [selected, setSelected] = useState(prefs)

  function toggle(genre) {
    setSelected(selected.includes(genre) ? selected.filter((g) => g !== genre) : [...selected, genre])
  }

  return (
    <div className={`${card} h-fit w-full max-w-md p-8 sm:p-10`}>
      <h1 className="text-center text-3xl font-bold tracking-tight">Adjust Preferences</h1>
      <p className="mt-2 text-center text-[#392525]/70">Pick what you want more of in your recommendations.</p>

      <div className="mt-8 space-y-3">
        {genres.map((genre) => (
          <label
            key={genre}
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${selected.includes(genre) ? 'border-[#392525] bg-[#392525]/5' : 'border-[#392525]/20 bg-[#FAF5E9] hover:bg-[#392525]/5'}`}
          >
            <span className="font-medium text-[#392525]">More {genre.toLowerCase()}</span>
            <input className="size-5 accent-[#392525]" type="checkbox" checked={selected.includes(genre)} onChange={() => toggle(genre)} />
          </label>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <button className={`${secondaryButton} flex-1`} type="button" onClick={onBack}>Back</button>
        <button className={`${button} flex-1 disabled:opacity-50`} type="button" disabled={selected.length === 0} onClick={() => onSave(selected)}>
          Save
        </button>
      </div>
    </div>
  )
}

function Saved({ onHome }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center self-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#392525]/10 text-[#392525]" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 10 17l9-10" />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Your preferences have been saved.</h1>
      <p className="mt-2 text-[#392525]/70">Your recommendations are updated.</p>
      <button className={`${button} mt-8`} type="button" onClick={onHome}>See Recommendations</button>
    </div>
  )
}
