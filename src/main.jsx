import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import FrontPage from './FrontPage.jsx'
import PreferencesPage from './PreferencesPage.jsx'
import LoginPage from './LoginPage.jsx'
import Navbar from './components/Navbar.jsx'
import { isPrimaryPath, locationPath } from './navigation.js'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'
import './index.css'
import './home.css'

const screens = { '/login': LoginPage, '/preferences': PreferencesPage }

function Page() {
  const [pathname, setPathname] = useState(locationPath)

  useEffect(() => {
    const syncPath = () => setPathname(locationPath())
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  function followLink(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
      event.shiftKey || event.altKey) return

    const link = event.target.closest('a[href]')
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return

    const url = new URL(link.href)
    const path = locationPath(url)
    const legacyDiscover = url.pathname === '/' && url.hash === '#discover'
    if (url.origin !== window.location.origin || (url.hash && !legacyDiscover) ||
      (!isPrimaryPath(path) && !Object.hasOwn(screens, path))) return

    event.preventDefault()
    const next = path + url.search
    if (next !== window.location.pathname + window.location.search) {
      window.history.pushState(null, '', next)
      setPathname(path)
    }
  }

  const Screen = screens[pathname]
  return (
    <div onClick={followLink}>
      {isPrimaryPath(pathname) ? <FrontPage pathname={pathname} /> : (
        <div className="gamefinder-page flex min-h-screen flex-col">
          <Navbar currentPath={pathname} />
          {Screen ? <Screen /> : <App />}
        </div>
      )}
    </div>
  )
}

if (window.location.pathname === '/' && window.location.hash === '#discover') {
  window.history.replaceState(null, '', locationPath() + window.location.search)
}

createRoot(document.getElementById('root')).render(
  <StrictMode><Page /></StrictMode>,
)
