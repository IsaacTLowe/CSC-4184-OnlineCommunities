import { useEffect, useState } from 'react'
import { ArrowUpRight, Gamepad2 } from 'lucide-react'
import { api, getMe } from '../api.js'
import { primaryLinks } from '../navigation.js'

export default function Navbar({ currentPath, preview = false }) {
  const [user, setUser] = useState(undefined)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)

  useEffect(() => {
    if (preview) return
    let active = true
    getMe().then((player) => {
      if (active) setUser(player)
    })
    return () => { active = false }
  }, [preview])

  async function logout() {
    setLoggingOut(true)
    setLogoutError(false)
    try {
      await api('/logout', { method: 'POST' })
      window.location.reload()
    } catch {
      setLoggingOut(false)
      setLogoutError(true)
    }
  }

  return (
    <header className="site-header">
      <nav className="home-shell site-navigation" aria-label="Main navigation">
        <a className="site-brand" href="/" aria-label="GameFinder landing page">
          <span className="site-brand-icon"><Gamepad2 size={22} strokeWidth={1.8} aria-hidden="true" /></span>
          GameFinder
        </a>
        <div className="site-nav-links">
          {primaryLinks.map(({ path, label }) => (
            <a key={path} href={path} aria-current={currentPath === path ? 'page' : undefined}>{label}</a>
          ))}
        </div>
        <div className="site-account-area">
          {user === undefined ? (
            <span className="site-account-placeholder" aria-hidden="true" />
          ) : user ? (
            <button className="site-account" type="button" disabled={loggingOut} onClick={logout}>
              <span className="site-account-user" title={user.username}>{user.username}</span>
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          ) : (
            <a className="site-account" href="/login" aria-current={currentPath === '/login' ? 'page' : undefined}>
              Log in <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          )}
          {logoutError && <p className="site-account-error" role="alert">Could not log out. Try again.</p>}
        </div>
      </nav>
    </header>
  )
}