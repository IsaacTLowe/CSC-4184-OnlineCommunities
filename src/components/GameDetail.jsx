import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { nintendoPlatforms, platformLabels } from '../gameCatalog.js'
import GameCover from './GameCover.jsx'

// Reusable popup with more detail about one game.
// Usage: <GameDetail game={selectedGame} onClose={() => setSelectedGame(null)} />
// Renders nothing while `game` is null. Esc, the × button or a click outside closes it.
export default function GameDetail({ game, onClose, platform = 'all' }) {
  const dialogRef = useRef(null)
  const [steam, setSteam] = useState(null) // extra details from the Steam store, once loaded

  useEffect(() => {
    if (!game) return
    // Native <dialog>: handles Esc, focus and the backdrop for us.
    // The `open` check matters in dev, where StrictMode runs this effect twice.
    if (!dialogRef.current.open) dialogRef.current.showModal()

    let ignore = false // drop a slow response if the user has moved on to another game
    setSteam(null)
    if (!game.appid) return
    api(`/games/${game.appid}`)
      .then((details) => !ignore && setSteam(details))
      .catch(() => {}) // if it fails, the catalog info is enough
    return () => (ignore = true)
  }, [game])

  if (!game) return null

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // A click on the dialog element itself (not its content) means the backdrop was clicked.
      onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
      className="m-auto max-h-[90dvh] w-[min(92vw,40rem)] overflow-y-auto rounded-3xl bg-[#FAF5E9] p-0 text-[#392525] shadow-2xl backdrop:bg-[#392525]/50"
      aria-labelledby="game-detail-title"
    >
      <div className="relative">
        <GameCover key={game.id ?? game.appid} game={game} platform={platform} eager />
        <button
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-[#392525]/80 text-xl text-[#FAF5E9] transition hover:bg-[#392525]"
          type="button"
          aria-label="Close"
          onClick={() => dialogRef.current.close()}
        >
          ×
        </button>
      </div>

      <div className="p-6 sm:p-8">
        <h2 id="game-detail-title" className="text-2xl font-bold tracking-tight">{game.title}</h2>
        {steam && ((steam.developers ?? []).length > 0 || steam.releaseDate) && (
          <p className="mt-1 text-sm text-[#392525]/60">
            {[(steam.developers ?? []).join(', '), steam.releaseDate].filter(Boolean).join(' · ')}
          </p>
        )}

        <p className="game-platform-label mt-2">{(game.platforms ?? ['steam']).map(id => platformLabels[id]).join(' / ')}</p>
        <p className="mt-4 leading-relaxed text-[#392525]/80">{steam?.description || game.description}</p>

        <h3 className="mt-6 text-sm font-semibold tracking-wide text-[#392525]/60 uppercase">Genres</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {/* Our categories first, then Steam's own genres (skipping duplicates). */}
          {[...new Set([...game.tags, ...(steam?.genres ?? [])])].map((genre) => (
            <span key={genre} className="rounded-full bg-[#392525]/10 px-3 py-1 text-sm font-medium">
              {genre}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
        {game.appid && <a
          className="inline-flex items-center justify-center rounded-xl bg-[#392525] px-6 py-3 font-semibold text-[#FAF5E9] transition hover:bg-[#392525]/90"
          href={`https://store.steampowered.com/app/${game.appid}`}
          target="_blank"
          rel="noreferrer"
        >
          View on Steam
        </a>}
        {nintendoPlatforms.filter(id => game.products?.[id]).map(id => (
          <a key={id} className="home-button home-button-secondary" href={game.products[id].url} target="_blank" rel="noreferrer">View on {platformLabels[id]}</a>
        ))}
        </div>
      </div>
    </dialog>
  )
}
