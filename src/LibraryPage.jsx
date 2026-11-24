import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, Check, Download, Gamepad2, LoaderCircle, RefreshCw } from 'lucide-react'
import { api } from './api.js'
import { coverUrl } from './games.js'

const pageSize = 24

export default function LibraryPage({ onImported } = {}) {
  const [access, setAccess] = useState('loading')
  const [library, setLibrary] = useState(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const resultsHeading = useRef(null)
  const focusResults = useRef(false)
  const games = useMemo(
    () => [...(library?.games ?? [])].sort((left, right) => left.title.localeCompare(right.title)),
    [library],
  )

  useEffect(() => {
    let active = true
    api('/steam/library')
      .then(({ connected, library: savedLibrary }) => {
        if (!active) return
        setLibrary(savedLibrary)
        setAccess(connected ? 'connected' : 'unlinked')
      })
      .catch((failure) => {
        if (!active) return
        if (failure.status === 401) {
          setAccess('guest')
        } else {
          setError(failure.message)
          setAccess('error')
        }
      })
    return () => { active = false }
  }, [loadAttempt])

  useEffect(() => {
    if (library && focusResults.current) {
      focusResults.current = false
      if (!resultsHeading.current?.closest('[inert]')) resultsHeading.current?.focus()
    }
  }, [library])

  function reloadLibrary() {
    setAccess('loading')
    setError('')
    setLoadAttempt((attempt) => attempt + 1)
  }

  async function importLibrary() {
    if (importing) return
    setImporting(true)
    setError('')
    try {
      const result = await api('/steam/import', { method: 'POST' })
      focusResults.current = true
      setLibrary(result.library)
      setVisibleCount(pageSize)
      onImported?.()
    } catch (failure) {
      if (failure.status === 401) setAccess('guest')
      else setError(failure.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="gamefinder-home steam-library-page">
      <main className="home-shell steam-library-main" aria-labelledby="steam-library-title">
        <header className="steam-library-heading">
          <h1 id="steam-library-title">Steam Library</h1>
          <p>Import your Steam library to see the games you own.</p>
        </header>

        {access === 'connected' && library ? (
          <section className="steam-library-content" aria-labelledby="imported-games-title">
            <div className="steam-library-status">
              <div className="steam-status-content" role="status">
                <span className="steam-library-icon">
                  {importing
                    ? <LoaderCircle className="steam-import-spinner" size={23} aria-hidden="true" />
                    : <Check size={23} aria-hidden="true" />}
                </span>
                <div>
                  <p className="steam-status-title">{importing ? 'Importing your Steam library…' : 'Library imported'}</p>
                  <p>{importing
                    ? 'Showing your last imported games.'
                    : games.length + (games.length === 1 ? ' game imported successfully.' : ' games imported successfully.')}</p>
                </div>
              </div>
              <button className="home-button home-button-secondary" type="button" disabled={importing} onClick={importLibrary}>
                <RefreshCw size={16} aria-hidden="true" /> Import again
              </button>
            </div>
            {error && <p className="steam-library-error" role="alert">{error}</p>}

            <h2 ref={resultsHeading} id="imported-games-title" tabIndex={-1}>Imported games</h2>
            {games.length === 0 ? (
              <p className="steam-library-empty">Steam returned an empty library.</p>
            ) : (
              <ul className="discovery-grid steam-games">
                {games.slice(0, visibleCount).map((game, index) => (
                  <ImportedGame key={game.appid} game={game} loadCoverEarly={index < 4} />
                ))}
              </ul>
            )}
            {visibleCount < games.length && (
              <div className="steam-library-more">
                <button className="home-button home-button-secondary" type="button" onClick={() => setVisibleCount((count) => count + pageSize)}>
                  Show more games <ArrowDown size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className="steam-import-panel" aria-label="Import your Steam library">
            <span className="steam-library-icon">
              {access === 'loading' || importing
                ? <LoaderCircle className="steam-import-spinner" size={25} aria-hidden="true" />
                : <Gamepad2 size={26} strokeWidth={1.8} aria-hidden="true" />}
            </span>
            <div className="steam-import-copy">
              {access === 'loading' || importing ? (
                <div role="status">
                  <h2>{importing ? 'Importing your Steam library…' : 'Checking your Steam connection…'}</h2>
                  {importing && <p>Retrieving games from Steam.</p>}
                </div>
              ) : access === 'guest' ? (
                <>
                  <h2>Log in to import your library</h2>
                  <p>Log in to GameFinder or create an account to connect Steam.</p>
                  <a className="home-button home-button-primary" href="/login">Log in <ArrowRight size={17} aria-hidden="true" /></a>
                </>
              ) : access === 'unlinked' ? (
                <>
                  <h2>Connect your Steam account</h2>
                  <p>Sign in through Steam to link your library to GameFinder.</p>
                  <a className="home-button home-button-primary" href="/api/steam/login">Sign in with Steam <ArrowRight size={17} aria-hidden="true" /></a>
                </>
              ) : access === 'error' ? (
                <>
                  <h2>Couldn’t load your library</h2>
                  <p className="steam-library-error" role="alert">{error}</p>
                  <button className="home-button home-button-primary" type="button" onClick={reloadLibrary}>Try again</button>
                </>
              ) : (
                <>
                  <h2>Ready to import</h2>
                  <p>Set Game Details in your Steam profile to Public so GameFinder can read your library.</p>
                  {error && <p className="steam-library-error" role="alert">{error}</p>}
                  <button className="home-button home-button-primary" type="button" onClick={importLibrary}>
                    <Download size={17} aria-hidden="true" /> {error ? 'Try again' : 'Import Steam library'}
                  </button>
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function ImportedGame({ game, loadCoverEarly }) {
  const [coverFailed, setCoverFailed] = useState(false)

  return (
    <li className="steam-game">
      <div className="discovery-cover steam-game-cover">
        {coverFailed
          ? <Gamepad2 size={37} strokeWidth={1.45} aria-hidden="true" />
          : <img src={coverUrl(game.appid)} alt="" loading={loadCoverEarly ? "eager" : "lazy"} decoding="async" onError={() => setCoverFailed(true)} />}
      </div>
      <div className="discovery-card-info"><h3>{game.title}</h3></div>
    </li>
  )
}