import { useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import { coverUrl } from '../games.js'
import { getNintendoProduct } from '../gameCatalog.js'

// Prefer the selected edition's official artwork, then the existing Steam art.
export default function GameCover({ game, eager = false, platform = 'all' }) {
  const nintendo = getNintendoProduct(game, platform)
  const steam = game.appid ? coverUrl(game.appid) : null
  const otherNintendo = Object.values(game.products ?? {}).map(product => product.cover)
  const sources = [...new Set((platform === 'steam' || platform === 'all' ? [steam, nintendo?.cover, ...otherNintendo] : [nintendo?.cover, steam, ...otherNintendo]).filter(Boolean))]
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
