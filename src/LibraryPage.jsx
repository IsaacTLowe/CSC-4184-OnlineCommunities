import { useEffect, useState } from 'react'

const launchers = [
  { name: 'Steam', dot: 'top' },
  { name: 'Epic Games', dot: 'bottom' },
  { name: 'GOG', dot: 'middle' },
  { name: 'Xbox Store', dot: 'top' },
  { name: 'PlayStation Store', dot: 'bottom' },
  { name: 'itch.io', dot: 'middle' },
  { name: 'EA app', dot: 'middle' },
  { name: 'Ubisoft Connect', dot: 'bottom' },
]

export default function LibraryPage() {
  const [screen, setScreen] = useState('launchers')
  const [selectedPlatform, setSelectedPlatform] = useState('')

  useEffect(() => {
    if (screen !== 'loading') return undefined

    const loadingTimer = window.setTimeout(() => setScreen('recommendations'), 2000)
    return () => window.clearTimeout(loadingTimer)
  }, [screen])

  function selectLauncher(platform) {
    setSelectedPlatform(platform)
    setScreen('loading')
  }

  if (screen === 'loading') {
    return <LoadingScreen platform={selectedPlatform} />
  }

  if (screen === 'recommendations') {
    return <RecommendationsScreen onReturnToLibrary={() => setScreen('launchers')} />
  }

  return (
    <main className="library-page" aria-label="Game library">
      <div className="library-canvas">
        <Sidebar />

        <section className="launcher-panel" aria-labelledby="launcher-heading">
          <h1 id="launcher-heading">Select Your Game<br />Launcher</h1>

          <div className="game-grid" aria-label="Available game launchers">
            {launchers.map(({ name, dot }) => (
              <button className="game-tile" key={name} type="button" onClick={() => selectLauncher(name)}>
                <span className="game-cover">
                  <span className={`cover-dot cover-dot--${dot}`} />
                </span>
                <span className="platform-name">{name}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="import-area" aria-label="Import library">
          <button className="import-button" type="button">Import Library</button>

          <div className="import-preview" aria-hidden="true">
            <span className="preview-heading" />
            <div className="preview-lines">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </aside>

        <BottomPlaceholders />
      </div>
    </main>
  )
}

function LoadingScreen({ platform }) {
  return (
    <main className="library-page" aria-label="Loading game library">
      <div className="library-canvas">
        <Sidebar />

        <section className="loading-panel" aria-live="polite">
          <p className="screen-kicker">Loading your library from</p>
          <h1>{platform}</h1>
          <div className="loading-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="loading-copy">Loading...</p>
        </section>

        <BottomPlaceholders />
      </div>
    </main>
  )
}

function RecommendationsScreen({ onReturnToLibrary }) {
  return (
    <main className="library-page" aria-label="Game recommendations">
      <div className="library-canvas">
        <Sidebar />

        <section className="recommendations-panel" aria-labelledby="recommendations-heading">
          <p className="completion-status">Done</p>
          <h1 id="recommendations-heading">You May Like These!</h1>
          <div className="recommendation-grid" aria-label="Recommended games">
            {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
          </div>
          <button className="return-library-button" type="button" onClick={onReturnToLibrary}>
            Back to Library
          </button>
        </section>

        <BottomPlaceholders />
      </div>
    </main>
  )
}

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Library navigation">
      <div className="profile-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="32" cy="23" r="15" />
          <path d="M12 57c1-13 9-22 20-22s19 9 20 22" />
        </svg>
      </div>

      <div className="sidebar-placeholders" aria-hidden="true">
        <div className="placeholder-row"><span /><span /></div>
        <div className="placeholder-row"><span /><span /></div>
        <div className="placeholder-row"><span /><span /></div>
      </div>
    </aside>
  )
}

function BottomPlaceholders() {
  return (
    <nav className="bottom-placeholders" aria-label="Additional navigation">
      <button className="bottom-action" type="button">Preferences</button>
      <button className="bottom-action" type="button">Contact Us</button>
    </nav>
  )
}
