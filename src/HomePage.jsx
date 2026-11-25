import { useEffect, useState } from 'react'
import {
  ArrowDown, ArrowRight, BookOpen, Compass, Gamepad2, Ghost, Puzzle, Scan, Search, SlidersHorizontal, Swords, Users, X,
} from 'lucide-react'
import { coverUrl, games, genres, recommend } from './games.js'
import GameDetail from './components/GameDetail.jsx'
import { usePlayerPreferences } from './preferences.js'

const pageSize = 8
const genreIcons = { Combat: Swords, Exploration: Compass, Story: BookOpen, Puzzle, Horror: Ghost, Multiplayer: Users }
const featuredGame = games.find((game) => game.appid === 1145360)
const featuredArt = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/' + featuredGame.appid + '/library_hero.jpg'

export default function HomePage({ preview, preferencesRevision }) {
  return (
    <div className="gamefinder-home discovery-page">
      <main className="home-shell discovery-main" aria-labelledby="discovery-title">
        <h1 id="discovery-title" className="sr-only" tabIndex={-1}>Discover games</h1>
        <GameDiscovery preview={preview} preferencesRevision={preferencesRevision} />
      </main>
      <footer className="home-footer">
        <div className="home-shell">
          <a className="home-footer-brand" href="/"><Gamepad2 size={21} aria-hidden="true" /> GameFinder</a>
          <a href="/contact">Contact Us</a>
        </div>
      </footer>
    </div>
  )
}

function GameDiscovery({ preview, preferencesRevision }) {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [selectedGame, setSelectedGame] = useState(null)
  const { user, prefs } = usePlayerPreferences(preferencesRevision)
  const search = query.trim().toLowerCase()
  const hasFilter = Boolean(search || genre)
  const results = hasFilter
    ? games.filter((game) =>
        (!genre || game.tags.includes(genre)) &&
        [game.title, ...game.tags].join(' ').toLowerCase().includes(search),
      )
    : recommend(prefs, user?.ownedAppIds)

  useEffect(() => {
    if (preview) setSelectedGame(null)
  }, [preview])

  function updateQuery(next) {
    setQuery(next)
    setVisibleCount(pageSize)
  }

  function updateGenre(next) {
    setGenre(next)
    setVisibleCount(pageSize)
  }

  function resetFilters() {
    updateQuery('')
    updateGenre('')
  }

  return (
    <div className="home-discovery">
      <section className="discovery-feature" aria-labelledby="featured-title">
        <img className="discovery-feature-art" src={featuredArt} alt="" decoding="async" onError={(event) => { event.currentTarget.hidden = true }} />
        <div className="discovery-feature-copy">
          <p className="discovery-feature-label">Featured game</p>
          <h2 id="featured-title">{featuredGame.title}</h2>
          <p>{featuredGame.description}</p>
          <button className="home-button" type="button" onClick={() => setSelectedGame(featuredGame)}>
            View game <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      <div className="discovery-controls">
        <div className="discovery-tools">
          <div className="discovery-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search games"
              placeholder="Search games"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => updateQuery('')}>
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
          <a className="discovery-preferences" href="/preferences" aria-label="Preferences" title="Preferences">
            <SlidersHorizontal size={19} aria-hidden="true" />
          </a>
        </div>
        <div className="discovery-genres" role="group" aria-label="Filter games by genre">
          {genres.map((name) => {
            const Icon = genreIcons[name]
            return (
              <button
                className="discovery-genre-tile"
                key={name}
                type="button"
                aria-pressed={genre === name}
                onClick={() => updateGenre(genre === name ? '' : name)}
              >
                <Icon size={23} strokeWidth={1.65} aria-hidden="true" />
                <span>{name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <section className="discovery-results" aria-labelledby="results-title">
        <div className="discovery-results-header">
          <div className="discovery-summary" aria-live="polite">
            <h2 id="results-title">{hasFilter ? genre || 'Search results' : 'Recommended for you'}</h2>
            <p>{hasFilter
              ? results.length + (results.length === 1 ? ' game found' : ' games found')
              : prefs.join(', ')}</p>
          </div>
          {hasFilter && <button className="home-button home-button-secondary" type="button" onClick={resetFilters}>Back to recommendations</button>}
        </div>
        {results.length > 0 ? (
          <div className="discovery-grid">
            {results.slice(0, visibleCount).map((game, index) => (
              <GameCard key={game.appid} game={game} loadCoverEarly={index < 4} onSelect={() => setSelectedGame(game)} />
            ))}
          </div>
        ) : (
          <p className="discovery-empty">{hasFilter
            ? 'No games match. Try another search or genre.'
            : 'Try adjusting your preferences to find more games.'}</p>
        )}
        {visibleCount < results.length && (
          <div className="discovery-more">
            <button className="home-button home-button-secondary" type="button" onClick={() => setVisibleCount(visibleCount + pageSize)}>
              Show more games <ArrowDown size={17} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
      <GameDetail game={preview ? null : selectedGame} onClose={() => setSelectedGame(null)} />
    </div>
  )
}

function GameCard({ game, loadCoverEarly, onSelect }) {
  const [coverFailed, setCoverFailed] = useState(false)

  return (
    <button className="discovery-card" type="button" onClick={onSelect} aria-label={'View ' + game.title + ' details'}>
      <div className={'discovery-cover bg-gradient-to-br ' + game.color}>
        {!coverFailed && <img src={coverUrl(game.appid)} alt="" loading={loadCoverEarly ? 'eager' : 'lazy'} decoding="async" onError={() => setCoverFailed(true)} />}
      </div>
      <div className="discovery-card-info">
        <div>
          <h3>{game.title}</h3>
          <p>{game.tags.join(' · ')}</p>
        </div>
        <span className="discovery-expand"><Scan size={18} strokeWidth={1.7} aria-hidden="true" /></span>
      </div>
    </button>
  )
}