import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, Download, Gamepad2, Library, LoaderCircle, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { api } from './api.js'
import ConsoleCatalog from './components/ConsoleCatalog.jsx'
import { GameCover } from './components/GameCover.jsx'
import { consolePlatforms, platformNames } from '../shared/platforms.js'

const pageSize = 24
const views = [{ id: 'all', name: 'All games' }, ...Object.entries(platformNames).map(([id, name]) => ({ id, name }))]

export default function LibraryPage({ onImported } = {}) {
  const [access, setAccess] = useState('loading')
  const [games, setGames] = useState([])
  const [steam, setSteam] = useState({ connected: false, imported: false })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [error, setError] = useState('')
  const [steamError, setSteamError] = useState('')
  const [notice, setNotice] = useState('')
  const [importing, setImporting] = useState(false)
  const [mutation, setMutation] = useState('')
  const [view, setView] = useState('all')
  const [catalogPlatform, setCatalogPlatform] = useState(null)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState('name')
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const resultsHeading = useRef(null)
  const focusResults = useRef(false)
  const busy = importing || Boolean(mutation)
  const counts = useMemo(() => Object.fromEntries(views.map(({ id }) => [id, id === 'all' ? games.length : games.filter((game) => game.platform === id).length])), [games])
  const ownedIds = useMemo(() => new Set(games.map((game) => game.id)), [games])
  const viewGames = useMemo(() => games.filter((game) => view === 'all' || game.platform === view), [games, view])
  const genres = useMemo(() => [...new Set(viewGames.flatMap((game) => game.genres ?? []))].sort(), [viewGames])
  const filteredGames = useMemo(() => viewGames
    .filter((game) => game.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (!genre || game.genres?.includes(genre)))
    .sort((left, right) => sort === 'recent'
      ? (right.addedAt ?? '').localeCompare(left.addedAt ?? '') || left.title.localeCompare(right.title)
      : (sort === '-name' ? -1 : 1) * left.title.localeCompare(right.title)), [viewGames, search, genre, sort])

  function applyLibrary(result) {
    setGames(result.library.games)
    setSteam(result.steam)
  }

  function handleExpiredSession(failure) {
    if (failure.status !== 401) return
    setAccess('guest')
    setGames([])
    setSteam({ connected: false, imported: false })
  }

  useEffect(() => {
    const controller = new AbortController()
    api('/library', { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        applyLibrary(result)
        setAccess('ready')
      })
      .catch((failure) => {
        if (controller.signal.aborted) return
        if (failure.status === 401) setAccess('guest')
        else { setError(failure.message); setAccess('error') }
      })
    return () => controller.abort()
  }, [loadAttempt])

  useEffect(() => {
    if (!focusResults.current) return
    focusResults.current = false
    if (!resultsHeading.current?.closest('[inert]')) resultsHeading.current?.focus()
  }, [games])

  function chooseView(nextView) {
    setView(nextView)
    setSearch('')
    setGenre('')
    setVisibleCount(pageSize)
  }

  function navigateTabs(event, index) {
    const next = event.key === 'ArrowRight' ? (index + 1) % views.length
      : event.key === 'ArrowLeft' ? (index + views.length - 1) % views.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : null
    if (next === null) return
    event.preventDefault()
    chooseView(views[next].id)
    document.getElementById(`library-tab-${views[next].id}`)?.focus()
  }

  function reloadLibrary() {
    setAccess('loading')
    setError('')
    setLoadAttempt((attempt) => attempt + 1)
  }

  async function importLibrary() {
    if (busy) return
    setImporting(true)
    setSteamError('')
    setNotice('')
    try {
      const result = await api('/steam/import', { method: 'POST' })
      focusResults.current = true
      setGames(result.generalLibrary.games)
      setSteam({ connected: true, imported: true })
      chooseView('steam')
      setNotice(`${result.gameCount} Steam games imported. Your recommendations have been updated.`)
      onImported?.()
    } catch (failure) {
      handleExpiredSession(failure)
      setSteamError(failure.message)
    } finally {
      setImporting(false)
    }
  }

  async function addGames(platform, gameIds) {
    if (busy) return
    setMutation('adding')
    setError('')
    setNotice('')
    try {
      const result = await api(`/library/${platform}/games`, { method: 'POST', body: { gameIds } })
      applyLibrary(result)
      setNotice(`${result.addedCount} ${platformNames[platform]} ${result.addedCount === 1 ? 'game' : 'games'} added to your library.`)
      return result
    } catch (failure) {
      handleExpiredSession(failure)
      throw failure
    } finally {
      setMutation('')
    }
  }

  async function removeGame(game) {
    if (busy) return
    setMutation(game.id)
    setError('')
    setNotice('')
    try {
      const result = await api(`/library/${game.platform}/games/${encodeURIComponent(game.id.slice(game.platform.length + 1))}`, { method: 'DELETE' })
      applyLibrary(result)
      setNotice(`${game.title} removed from your ${platformNames[game.platform]} library.`)
    } catch (failure) {
      handleExpiredSession(failure)
      setError(failure.message)
    } finally {
      setMutation('')
    }
  }

  return (
    <div className="gamefinder-home steam-library-page">
      <main className="home-shell steam-library-main general-library-main" aria-labelledby="library-title">
        <header className="steam-library-heading library-heading">
          <span className="library-eyebrow"><Library size={16} aria-hidden="true" /> YOUR COLLECTION</span>
          <h1 id="library-title">Your library</h1>
          <p>All your games. One place. Bring Steam, Xbox and PlayStation together.</p>
        </header>

        <div className="library-tabs" role="tablist" aria-label="Library platform">
          {views.map(({ id, name }, index) => (
            <button key={id} id={`library-tab-${id}`} role="tab" aria-selected={view === id} aria-controls="library-collection" tabIndex={view === id ? 0 : -1}
              type="button" onClick={() => chooseView(id)} onKeyDown={(event) => navigateTabs(event, index)}>
              {name} <span className="library-tab-count">{counts[id]}</span>
            </button>
          ))}
        </div>

        <section className="library-sources" aria-label="Add games to your library">
          <SteamImportPanel access={access} steam={steam} count={counts.steam} importing={importing} disabled={busy}
            error={access === 'error' ? error : steamError} onImport={importLibrary} onReload={reloadLibrary} />
          <div className="console-source-options">
            {Object.entries(consolePlatforms).map(([id, platform]) => (
              <div className="console-source-card" data-platform={id} key={id}>
                <span className="library-platform-icon"><Gamepad2 size={24} aria-hidden="true" /></span>
                <div><h2>{platform.name} games</h2><p>Find the games you own and add them to your library. No console sign-in needed.</p></div>
                <button id={`browse-${id}`} className="home-button home-button-secondary" type="button" aria-expanded={catalogPlatform === id}
                  disabled={mutation === 'adding'}
                  aria-controls={catalogPlatform === id ? 'console-catalog' : undefined} onClick={() => setCatalogPlatform(id)}>
                  <Plus size={16} aria-hidden="true" /> Add {platform.name} games
                </button>
              </div>
            ))}
          </div>
        </section>

        {catalogPlatform && <ConsoleCatalog key={catalogPlatform} platform={catalogPlatform} ownedIds={ownedIds} canAdd={access === 'ready'} busy={busy}
          onAdd={(ids) => addGames(catalogPlatform, ids)} onClose={() => {
            setCatalogPlatform(null)
            document.getElementById(`browse-${catalogPlatform}`)?.focus()
          }} />}

        <div className="library-feedback" aria-live="polite">{notice && <p className="library-success">{notice}</p>}</div>
        {error && access !== 'error' && <p className="steam-library-error" role="alert">{error}</p>}

        <section id="library-collection" className="library-collection" role="tabpanel" aria-labelledby={`library-tab-${view}`}>
          <div className="library-collection-heading">
            <div><h2 ref={resultsHeading} tabIndex={-1}>{view === 'all' ? 'All your games' : `${platformNames[view]} library`}</h2>
              <p>{access === 'ready' ? `${filteredGames.length} ${filteredGames.length === 1 ? 'game' : 'games'}${search || genre ? ' matching your filters' : ' in your collection'}` : 'Your saved games will appear here.'}</p></div>
          </div>
          {access === 'ready' && viewGames.length > 0 && <div className="library-tools">
            <label className="discovery-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Search your library</span>
              <input type="search" value={search} placeholder="Search your library…" onChange={(event) => { setSearch(event.target.value); setVisibleCount(pageSize) }} />
              {search && <button type="button" aria-label="Clear library search" onClick={() => setSearch('')}><X size={16} aria-hidden="true" /></button>}
            </label>
            {genres.length > 0 && <label className="library-select"><span className="sr-only">Filter your library by genre</span>
              <select value={genre} onChange={(event) => { setGenre(event.target.value); setVisibleCount(pageSize) }}><option value="">All genres</option>{genres.map((name) => <option key={name}>{name}</option>)}</select>
            </label>}
            <label className="library-select"><span className="sr-only">Sort your library</span><select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="name">Title: A–Z</option><option value="-name">Title: Z–A</option><option value="recent">Recently added</option>
            </select></label>
          </div>}

          {access === 'loading' ? <p className="library-empty" role="status"><LoaderCircle className="steam-import-spinner" size={22} aria-hidden="true" /> Loading your library…</p>
            : access === 'guest' ? <div className="library-empty"><Library size={32} aria-hidden="true" /><h3>Make room for all your games</h3><p>Log in or create a GameFinder account to save games across platforms.</p><a className="home-button home-button-primary" href="/login">Log in <ArrowRight size={16} aria-hidden="true" /></a></div>
              : access === 'error' ? <p className="library-empty">Your library could not be loaded. Use “Try again” above to reconnect.</p>
                : filteredGames.length === 0 ? <div className="library-empty"><Gamepad2 size={32} aria-hidden="true" /><h3>{search || genre ? 'No games match your filters' : view === 'all' ? 'Your collection starts here' : `No ${platformNames[view]} games yet`}</h3>
                  <p>{search || genre ? 'Try another title or clear your filters.' : view === 'steam' ? 'Connect Steam and import your games using the Steam library import above.' : 'Import Steam games or browse the console catalogs above to add your first games.'}</p>
                  {(search || genre) && <button className="home-button home-button-secondary" type="button" onClick={() => { setSearch(''); setGenre('') }}>Clear filters</button>}</div>
                  : <ul className="discovery-grid steam-games library-game-grid">{filteredGames.slice(0, visibleCount).map((game, index) => (
                    <li className="steam-game library-game" key={game.id}>
                      <GameCover src={game.imageUrl} eager={index < 4} />
                      <div className="library-game-info"><span className="library-platform-badge" data-platform={game.platform}>{platformNames[game.platform]}</span>
                        <h3>{game.title}</h3>{game.genres?.length > 0 && <p>{game.genres.join(' · ')}</p>}
                        {game.platform === 'steam' ? <span className="library-imported-label">Imported from Steam</span> : <button className="library-remove" type="button" disabled={busy} onClick={() => removeGame(game)} aria-label={`Remove ${game.title} from your ${platformNames[game.platform]} library`}>
                          {mutation === game.id ? <LoaderCircle className="steam-import-spinner" size={14} aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />} Remove
                        </button>}
                      </div>
                    </li>
                  ))}</ul>}
          {access === 'ready' && visibleCount < filteredGames.length && <div className="steam-library-more"><button className="home-button home-button-secondary" type="button" onClick={() => setVisibleCount((count) => count + pageSize)}>Show more games <ArrowDown size={16} aria-hidden="true" /></button></div>}
          {games.some((game) => game.platform !== 'steam') && <p className="catalog-attribution">Console game data and artwork provided by <a href="https://www.igdb.com" target="_blank" rel="noreferrer">IGDB</a>.</p>}
        </section>
      </main>
    </div>
  )
}

function SteamImportPanel({ access, steam, count, importing, disabled, error, onImport, onReload }) {
  const title = importing ? 'Importing your Steam library…' : access === 'loading' ? 'Checking your Steam connection…'
    : access === 'guest' ? 'Log in to import your Steam library' : access === 'error' ? 'Couldn’t load your library'
      : !steam.connected ? 'Connect your Steam account' : steam.imported ? 'Steam library imported' : 'Import your Steam library'
  return (
    <div className="steam-import-panel library-steam-import">
      <span className="steam-library-icon">{access === 'loading' || importing ? <LoaderCircle className="steam-import-spinner" size={25} aria-hidden="true" /> : <Download size={24} aria-hidden="true" />}</span>
      <div className="steam-import-copy">
        <span className="library-source-label">STEAM LIBRARY IMPORT</span><h2>{title}</h2>
        <div role={importing || access === 'loading' ? 'status' : undefined}>
          {importing ? <p>Retrieving your games and updating recommendations. Your last import stays available.</p>
            : access === 'guest' ? <p>Use your GameFinder account to connect Steam and save your imported games.</p>
              : access === 'ready' && !steam.connected ? <p>Sign in through Steam to include your Steam games in your general library.</p>
                : access === 'ready' && steam.imported ? <p>{count} {count === 1 ? 'game' : 'games'} imported. View them in All games or Steam, and import again any time.</p>
                  : access === 'ready' ? <p>Set Game Details in your Steam profile to Public. Importing also personalizes your recommendations.</p> : null}
        </div>
        {error && <p className="steam-library-error" role="alert">{error}</p>}
        {access === 'guest' ? <a className="home-button home-button-primary" href="/login">Log in <ArrowRight size={16} aria-hidden="true" /></a>
          : access === 'error' ? <button className="home-button home-button-primary" type="button" onClick={onReload}>Try again</button>
            : access === 'ready' && !steam.connected ? <a className="home-button home-button-primary" href="/api/steam/login">Sign in with Steam <ArrowRight size={16} aria-hidden="true" /></a>
              : access === 'ready' ? <button className="home-button home-button-primary" type="button" disabled={disabled} onClick={onImport}>
                {steam.imported ? <RefreshCw size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}{importing ? 'Importing…' : steam.imported ? 'Import again' : 'Import Steam library'}
              </button> : null}
      </div>
    </div>
  )
}
