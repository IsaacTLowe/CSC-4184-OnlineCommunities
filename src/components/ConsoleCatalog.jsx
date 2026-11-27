import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Gamepad2, LoaderCircle, Plus, Search, X } from 'lucide-react'
import { api } from '../api.js'
import { GameCover } from './GameCover.jsx'
import { catalogGenres, consolePlatforms } from '../../shared/platforms.js'

export default function ConsoleCatalog({ platform, ownedIds, canAdd, busy, onAdd, onClose }) {
  const config = consolePlatforms[platform]
  const [query, setQuery] = useState({ search: '', genre: '', console: '', sort: '-added', page: 1 })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [selected, setSelected] = useState(new Map())
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const heading = useRef(null)
  const selectedIds = useMemo(() => [...selected.values()].filter((game) => !ownedIds.has(game.id)).map((game) => game.catalogId), [selected, ownedIds])
  const disabled = busy || saving

  useEffect(() => {
    if (!heading.current?.closest('[inert]')) heading.current?.focus()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    const timer = setTimeout(() => {
      api(`/catalog/${platform}/games?${new URLSearchParams(query)}`, { signal: controller.signal })
        .then((result) => { if (!controller.signal.aborted) setData(result) })
        .catch((failure) => { if (!controller.signal.aborted) setError(failure.message) })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, query.search ? 300 : 0)
    return () => { clearTimeout(timer); controller.abort() }
  }, [platform, query, attempt])

  function filter(name, value) {
    setQuery((current) => ({ ...current, [name]: value, page: 1 }))
  }

  function toggle(game) {
    setSaveError('')
    setSelected((current) => {
      const next = new Map([...current].filter(([id]) => !ownedIds.has(id)))
      if (next.has(game.id)) next.delete(game.id)
      else if (next.size < 50) next.set(game.id, game)
      return next
    })
  }

  async function addSelected() {
    if (!selectedIds.length || disabled) return
    setSaving(true)
    setSaveError('')
    try {
      await onAdd(selectedIds)
      setSelected(new Map())
    } catch (failure) {
      setSaveError(failure.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="console-catalog" className="console-catalog" data-platform={platform} aria-labelledby="catalog-title">
      <div className="catalog-heading">
        <div><span className="library-source-label">BUILD YOUR COLLECTION</span><h2 ref={heading} tabIndex={-1} id="catalog-title">Browse {config.name} games</h2><p>Search the catalog, filter by console or genre, and select the games you own.</p></div>
        <button className="catalog-close" type="button" onClick={onClose} disabled={saving} aria-label="Close game catalog"><X size={21} aria-hidden="true" /></button>
      </div>
      <div className="catalog-tools">
        <label className="discovery-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Search {config.name} games</span>
          <input type="search" value={query.search} maxLength={120} disabled={saving} placeholder={`Search ${config.name} games…`} onChange={(event) => filter('search', event.target.value)} />
          {query.search && <button type="button" disabled={saving} aria-label="Clear catalog search" onClick={() => filter('search', '')}><X size={16} aria-hidden="true" /></button>}
        </label>
        <label className="library-select"><span className="sr-only">Filter by console</span><select value={query.console} disabled={saving} onChange={(event) => filter('console', event.target.value)}>
          <option value="">All {config.name} consoles</option>{config.consoles.map((console) => <option key={console.id} value={console.id}>{console.name}</option>)}
        </select></label>
        <label className="library-select"><span className="sr-only">Filter catalog by genre</span><select value={query.genre} disabled={saving} onChange={(event) => filter('genre', event.target.value)}>
          <option value="">All genres</option>{catalogGenres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
        </select></label>
        <label className="library-select"><span className="sr-only">Sort catalog</span><select value={query.sort} disabled={saving} onChange={(event) => filter('sort', event.target.value)}>
          <option value="-added">Most popular</option><option value="name">Title: A–Z</option><option value="-released">Newest releases</option><option value="-rating">Highest rated</option>
        </select></label>
      </div>

      <div className="catalog-results" aria-busy={loading}>
        {loading ? <div className="library-empty" role="status"><LoaderCircle className="steam-import-spinner" size={25} aria-hidden="true" /><p>Loading {config.name} games…</p></div>
          : error ? <div className="library-empty"><p className="steam-library-error" role="alert">{error}</p><button className="home-button home-button-secondary" type="button" onClick={() => setAttempt((current) => current + 1)}>Try again</button></div>
            : !data?.games.length ? <div className="library-empty"><Gamepad2 size={32} aria-hidden="true" /><h3>No games found</h3><p>Try a different search or broaden your console and genre filters.</p><button className="home-button home-button-secondary" type="button" onClick={() => setQuery({ search: '', genre: '', console: '', sort: '-added', page: 1 })}>Clear filters</button></div>
              : <>
                <p className="catalog-result-count" role="status">{data.count.toLocaleString()} {config.name} games · Page {data.page} of {Math.max(1, Math.ceil(data.count / data.pageSize)).toLocaleString()}</p>
                <ul className="discovery-grid steam-games catalog-game-grid">
                  {data.games.map((game, index) => {
                    const owned = ownedIds.has(game.id)
                    const checked = !owned && selected.has(game.id)
                    return <li className="steam-game catalog-game" data-selected={checked || undefined} key={game.id}>
                      <label className="catalog-game-choice">
                        <span className="catalog-game-cover"><GameCover src={game.imageUrl} eager={index < 4} />
                          <span className={`catalog-check${owned ? ' catalog-owned' : ''}`}>
                            {owned ? <Check size={17} aria-hidden="true" /> : <input type="checkbox" checked={checked} disabled={disabled || (!checked && selectedIds.length >= 50)} onChange={() => toggle(game)} aria-label={`Select ${game.title}`} />}
                          </span>
                        </span>
                        <span className="library-game-info"><span className="catalog-game-title">{game.title}</span><span className="catalog-game-metadata">{game.consoles.join(' · ')}{game.released ? ` · ${game.released.slice(0, 4)}` : ''}</span>
                          <span className="catalog-game-metadata">{game.genres.join(' · ') || 'Uncategorized'}</span><span className="catalog-choice-label">{owned ? 'Already in your library' : checked ? 'Selected' : 'Select game'}</span>
                        </span>
                      </label>
                    </li>
                  })}
                </ul>
                <div className="catalog-pagination" aria-label="Catalog pagination">
                  <button className="home-button home-button-secondary" type="button" disabled={data.page <= 1 || saving} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}><ArrowLeft size={16} aria-hidden="true" /> Previous</button>
                  <span>Page {data.page}</span>
                  <button className="home-button home-button-secondary" type="button" disabled={!data.hasNext || saving} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Next <ArrowRight size={16} aria-hidden="true" /></button>
                </div>
              </>}
      </div>
      {saveError && <p className="steam-library-error" role="alert">{saveError}</p>}
      <div className="catalog-selection">
        <div role="status"><strong>{selectedIds.length} {selectedIds.length === 1 ? 'game' : 'games'} selected</strong><p>{selectedIds.length >= 50 ? 'Add these games before selecting more.' : 'Select up to 50 games across searches and pages.'}</p></div>
        <div className="catalog-selection-actions">
          {selectedIds.length > 0 && <button className="home-button home-button-secondary" type="button" disabled={disabled} onClick={() => setSelected(new Map())}>Clear selection</button>}
          {canAdd ? <button className="home-button home-button-primary" type="button" disabled={!selectedIds.length || disabled} onClick={addSelected}>
            {saving ? <LoaderCircle className="steam-import-spinner" size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}{saving ? 'Adding games…' : selectedIds.length ? `Add ${selectedIds.length} ${selectedIds.length === 1 ? 'game' : 'games'} to library` : 'Add selected games'}
          </button> : <a className="home-button home-button-primary" href="/login">Log in to add games <ArrowRight size={16} aria-hidden="true" /></a>}
        </div>
      </div>
    </section>
  )
}
