import { useEffect, useState } from 'react'
import { api, getMe } from './api.js'
import { coverUrl, games, genres, recommend } from './games.js'
import GameDetail from './components/GameDetail.jsx'

const card = 'rounded-3xl border border-[#392525]/10 bg-[#FAF5E9] shadow-xl shadow-[#392525]/5'

const button =
  'inline-flex items-center justify-center rounded-xl bg-[#392525] px-6 py-3 font-semibold text-[#FAF5E9] shadow-sm transition hover:bg-[#392525]/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#392525]'

const secondaryButton =
  'inline-flex items-center justify-center rounded-xl border border-[#392525]/20 bg-[#FAF5E9] px-6 py-3 font-semibold text-[#392525] shadow-sm transition hover:bg-[#392525]/5'

export default function HomePage({ initialScreen = 'home' }) {
  const [screen, setScreen] = useState(initialScreen)
  const [prefs, setPrefs] = useState(() => JSON.parse(localStorage.getItem('prefs')) ?? ['Combat'])
  const [user, setUser] = useState(null)

  // Logged-in users keep their preferences (and owned Steam games) on the server.
  useEffect(() => {
    getMe().then((me) => {
      setUser(me)
      if (me?.prefs) setPrefs(me.prefs)
    })
  }, [])

  async function savePrefs(next) {
    localStorage.setItem('prefs', JSON.stringify(next))
    // If the server save fails (e.g. session expired after a restart), the local copy above still applies.
    if (user) await api('/prefs', { method: 'PUT', body: { prefs: next } }).catch(() => {})
    setPrefs(next)
    setScreen('saved')
  }

  return (
    <div className="flex flex-1 flex-col bg-[#FAF5E9] text-[#392525]">
      <main className="flex flex-1 justify-center px-4 py-12">
        {screen === 'home' && <Home prefs={prefs} ownedAppIds={user?.ownedAppIds} onAdjust={() => setScreen('prefs')} />}
        {screen === 'prefs' && (
          <Preferences prefs={prefs} onBack={() => setScreen('home')} onSave={savePrefs} />
        )}
        {screen === 'saved' && <Saved onHome={() => setScreen('home')} />}
      </main>
    </div>
  )
}

function Home({ prefs, ownedAppIds, onAdjust }) {
  const [query, setQuery] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)

  const searching = query.trim() !== ''
  const results = searching
    ? games.filter((g) => `${g.title} ${g.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
    : recommend(prefs, ownedAppIds)

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
            <GameCard key={game.title} game={game} prefs={prefs} onSelect={() => setSelectedGame(game)} />
          ))}
        </div>
      )}

      <GameDetail game={selectedGame} onClose={() => setSelectedGame(null)} />
    </div>
  )
}

function GameCard({ game, prefs, onSelect }) {
  return (
    <button
      className="group w-full cursor-pointer rounded-2xl text-left focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#392525]"
      type="button"
      onClick={onSelect}
    >
      {/* The gradient shows behind the cover and stays visible if the image fails to load. */}
      <div className={`aspect-[460/215] overflow-hidden rounded-2xl bg-gradient-to-br shadow-sm transition group-hover:shadow-lg group-hover:-translate-y-0.5 ${game.color}`}>
        <img
          className="size-full object-cover"
          src={coverUrl(game.appid)}
          alt={`${game.title} cover art`}
          loading="lazy"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      </div>
      <h2 className="mt-3 font-bold group-hover:underline">{game.title}</h2>
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
    </button>
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
