import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, Check, Plus, Search, Star, Trash2 } from 'lucide-react'
import { catalogById, normalizeSearch, nintendoCatalog, platformLabels, getNintendoProduct } from './gameCatalog.js'
import { usePlayerPreferences } from './preferences.js'
import { useNintendoLibrary } from './useNintendoLibrary.js'
import GameCover from './components/GameCover.jsx'

const pageSize = 12

export default function NintendoLibraryPage({ platform = 'nintendo' }) {
  const { user } = usePlayerPreferences()
  const { entries, save, loading } = useNintendoLibrary(user)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(pageSize)
  const [ownedOnly, setOwnedOnly] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const owned = new Map(entries.map(entry => [entry.gameId, entry]))
  const results = (ownedOnly ? entries.map(entry => catalogById.get(entry.gameId)).filter(Boolean) : nintendoCatalog)
    .filter(game => game.platforms.includes(platform))
    .filter(game => normalizeSearch(game.title).includes(normalizeSearch(query)))
    .sort((a, b) => a.title.localeCompare(b.title))

  useEffect(() => { setLimit(pageSize) }, [platform])

  const ownedCount = entries.filter(entry => catalogById.get(entry.gameId)?.platforms.includes(platform)).length

  function change(game, changes) {
    try {
      save(game.id, changes)
      setError('')
      setNotice(changes === null ? `${game.title} removed.` : owned.has(game.id) ? `${game.title} updated.` : `${game.title} added.`)
      return true
    } catch {
      setError('Could not save your Nintendo library. Check that browser storage is enabled and try again.')
      return false
    }
  }

  return (
    <main className="home-shell nintendo-library" aria-labelledby="nintendo-library-title">
      <header className="nintendo-heading">
        <h2 id="nintendo-library-title">{platformLabels[platform]} Library</h2>
        <p>Search for physical or digital games you own. No Nintendo account connection is required.</p>
        <p className="nintendo-storage-note">Switch 2 shows native releases and dedicated editions, not every backward-compatible Switch game. Ownership is tracked by title across editions.</p>
        <p className="nintendo-storage-note">{loading ? 'Checking your GameFinder session…' : user ? `Saved in this browser for ${user.username}. Not synced to your account server or other devices.` : 'Saved in this browser as a guest. Signing in opens a separate local library.'}</p>
      </header>
      <div className="nintendo-toolbar">
        <div className="discovery-search">
          <Search size={18} aria-hidden="true" />
          <input type="search" aria-label="Search Nintendo games" placeholder="Search Nintendo games" value={query} onChange={event => { setQuery(event.target.value); setLimit(pageSize) }} />
        </div>
        <div className="platform-selector" role="group" aria-label="Nintendo library view">
          <button type="button" aria-pressed={!ownedOnly} onClick={() => { setOwnedOnly(false); setLimit(pageSize) }}>Browse catalog</button>
          <button type="button" aria-pressed={ownedOnly} onClick={() => { setOwnedOnly(true); setLimit(pageSize) }}>My games ({ownedCount})</button>
        </div>
      </div>
      <p className="nintendo-result-count" role="status">{results.length} {results.length === 1 ? 'game' : 'games'} {ownedOnly ? 'in your results' : 'found'} · {ownedCount} owned</p>
      <p className="sr-only" role="status">{notice}</p>
      {error && <p className="steam-library-error" role="alert">{error}</p>}
      {results.length ? (
        <div className="discovery-grid nintendo-grid">
          {results.slice(0, limit).map(game => <NintendoCard key={game.id} game={game} platform={platform} entry={owned.get(game.id)} disabled={loading} onChange={changes => change(game, changes)} />)}
        </div>
      ) : <p className="discovery-empty">{ownedOnly ? 'No owned games match. Browse the catalog to add games.' : 'No matching games in the starter catalog.'}</p>}
      {limit < results.length && <div className="discovery-more"><button className="home-button home-button-secondary" type="button" onClick={() => setLimit(count => count + pageSize)}>Show more games <ArrowDown size={16} aria-hidden="true" /></button></div>}
      <div className="nintendo-next"><a className="home-button home-button-primary" href="/recommendations">See recommendations</a></div>
    </main>
  )
}

function NintendoCard({ game, platform, entry, disabled, onChange }) {
  return (
    <article className="nintendo-card">
      <GameCover game={game} platform={platform} />
      <div className="nintendo-card-body">
        <h3>{game.title}</h3>
        <p>{game.tags.join(' · ')}</p>
        <p className="game-platform-label">{game.platforms.map(id => platformLabels[id]).join(' / ')}</p>
        <a className="nintendo-store-link" aria-label={`View ${game.title} on ${platformLabels[platform]} store`} href={getNintendoProduct(game, platform).url} target="_blank" rel="noreferrer">View on Nintendo <ArrowUpRight size={15} aria-hidden="true" /></a>
        {entry ? (
          <>
            <span className="nintendo-owned"><Check size={16} aria-hidden="true" /> In your library</span>
            <label className="nintendo-hours">Hours played (optional)
              <input key={String(entry.playtimeHours)} type="number" min="0" max="100000" step="any" defaultValue={entry.playtimeHours ?? ''} disabled={disabled} aria-label={`Hours played: ${game.title}`} onBlur={event => {
                const input = event.currentTarget
                if (!input.validity.valid) { input.reportValidity(); input.value = entry.playtimeHours ?? ''; return }
                const value = input.value === '' ? null : Number(input.value)
                if (value !== entry.playtimeHours && !onChange({ playtimeHours: value })) input.value = entry.playtimeHours ?? ''
              }} />
            </label>
            <button className="home-button home-button-secondary" type="button" disabled={disabled} aria-pressed={entry.favorite} onClick={() => onChange({ favorite: !entry.favorite })}><Star size={16} fill={entry.favorite ? 'currentColor' : 'none'} aria-hidden="true" /> {entry.favorite ? 'Favorited' : 'Favorite'}</button>
            <button className="home-button home-button-secondary nintendo-remove" type="button" disabled={disabled} aria-label={`Remove ${game.title}`} onClick={() => onChange(null)}><Trash2 size={16} aria-hidden="true" /> Remove</button>
          </>
        ) : <button className="home-button home-button-primary" type="button" disabled={disabled} aria-label={`Add ${game.title} to library`} onClick={() => onChange({})}><Plus size={17} aria-hidden="true" /> Add to library</button>}
      </div>
    </article>
  )
}
