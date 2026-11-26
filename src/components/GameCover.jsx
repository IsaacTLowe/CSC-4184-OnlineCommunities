import { useState } from 'react'
import { Gamepad2 } from 'lucide-react'

export function GameCover({ src, eager = false }) {
  const [failed, setFailed] = useState(false)
  return <span className="discovery-cover steam-game-cover">
    {!src || failed ? <Gamepad2 size={37} strokeWidth={1.45} aria-hidden="true" />
      : <img src={src} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />}
  </span>
}
