import { useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import { coverUrl } from '../games.js'
import { getNintendoProduct } from '../gameCatalog.js'

// Prefer the selected edition's official artwork, then the existing Steam art.
export function GameCover({ game, src, eager = false, platform = 'all' }) {
  // Account-backed library and IGDB catalog use src; Discover and Nintendo use game.
  if (!game) return <SourceCover key={src || 'no-cover'} src={src} eager={eager} />
  const nintendo = getNintendoProduct(game, platform)
  const steam = game.appid ? coverUrl(game.appid) : null
  const otherNintendo = Object.values(game.products ?? {}).map(product => product.cover)
  const sources = [...new Set((platform === 'steam' || platform === 'all' ? [src, steam, nintendo?.cover, ...otherNintendo] : [nintendo?.cover, src, steam, ...otherNintendo]).filter(Boolean))]
  return <CoverImage key={sources.join('|') || game.id} game={game} sources={sources} eager={eager} />
}

function CoverImage({ game, sources, eager }) {
  const [index, setIndex] = useState(0)
  return (
    <div className={'discovery-cover catalog-cover bg-gradient-to-br ' + (game.color ?? '')}>
      {sources[index] ? (
        <img src={sources[index]} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setIndex(i => i + 1)} />
      ) : (
        <div className="catalog-cover-placeholder" aria-hidden="true"><Gamepad2 size={32} /><span>{game.title}</span></div>
      )}
    </div>
  )
}

export default GameCover

function SourceCover({ src, eager }) {
  const [failed, setFailed] = useState(false)
  return <span className="discovery-cover steam-game-cover">
    {!src || failed ? <Gamepad2 size={37} strokeWidth={1.45} aria-hidden="true" />
      : <img src={src} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />}
  </span>
}
