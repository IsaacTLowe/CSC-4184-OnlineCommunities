import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import HomePage from './HomePage.jsx'
import LibraryPage from './LibraryPage.jsx'
import ContactPage from './ContactPage.jsx'
import { defaultSection, primaryLinks } from './navigation.js'
import roomImage from './img/landing-gaming-room.webp'

const DiscoverPanel = memo(HomePage)
const LibraryPanel = memo(LibraryPage)
const ContactPanel = memo(ContactPage)

const zoomOptions = { duration: 500, easing: 'cubic-bezier(.55,.03,.19,1)', fill: 'both' }
const slideOptions = { duration: 310, easing: 'cubic-bezier(.34,.56,.36,1)', fill: 'both' }

function canAnimate(element) {
  return typeof element.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function frameTransform(x, y, scaleX, scaleY) {
  return 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + scaleX + ',' + scaleY + ')'
}

function measureMonitor(scene, anchor) {
  const origin = scene.getBoundingClientRect()
  const screen = anchor.getBoundingClientRect()
  const width = document.documentElement.clientWidth
  const height = window.innerHeight
  const scaleX = screen.width / width
  const scaleY = screen.height / height
  const previewHeight = Math.min(height, Math.max(screen.height / scaleX, width <= 690 ? 340 : 650))

  return {
    width,
    height,
    stretch: height / previewHeight,
    visible: scaleX > 0 && scaleY > 0 && screen.bottom > 0 && screen.right > 0 &&
      screen.top < height && screen.left < width,
    preview: frameTransform(screen.left - origin.left, screen.top - origin.top, scaleX, scaleY),
    full: frameTransform(-origin.left, -origin.top, 1, 1),
  }
}

function finishAnimations(animations, done) {
  Promise.all(animations.map((animation) => animation.finished)).then(done).catch(() => {})
  return () => animations.forEach((animation) => animation.cancel())
}

export default function FrontPage({ pathname }) {
  const [view, setView] = useState(() => ({
    landing: pathname === '/',
    section: pathname === '/' ? defaultSection : pathname,
    outgoing: null,
    motion: null,
  }))
  const [preferencesRevision, setPreferencesRevision] = useState(0)
  const refreshRecommendations = useCallback(() => setPreferencesRevision((revision) => revision + 1), [])
  const scene = useRef(null)
  const anchor = useRef(null)
  const surface = useRef(null)
  const screenContent = useRef(null)
  const previewNav = useRef(null)
  const shade = useRef(null)
  const hero = useRef(null)
  const panels = useRef({})
  const focusedPath = useRef(pathname)
  const { landing, section, outgoing, motion } = view

  // Finish the current movement before starting one toward the latest requested
  // route. The same mounted panels serve the monitor and the full-size web app.
  useLayoutEffect(() => {
    if (motion) return
    if (pathname === '/' && !landing) {
      setView({ ...view, landing: true, motion: 'out' })
      return
    }
    const target = pathname === '/' ? defaultSection : pathname
    if (target !== section) {
      setView({ ...view, section: target, outgoing: section, motion: 'slide' })
    } else if (pathname !== '/' && landing) {
      setView({ ...view, motion: 'in' })
    }
  }, [pathname, view, landing, section, motion])

  useLayoutEffect(() => {
    const page = surface.current
    const content = screenContent.current
    if (!landing) {
      page.removeAttribute('style')
      content.removeAttribute('style')
      return
    }

    function alignMonitor() {
      const monitor = measureMonitor(scene.current, anchor.current)
      page.style.width = monitor.width + 'px'
      page.style.height = monitor.height + 'px'
      page.style.transform = monitor.preview
      page.style.visibility = 'visible'
      content.style.transform = 'scaleY(' + monitor.stretch + ')'
    }

    const observer = new ResizeObserver(alignMonitor)
    alignMonitor()
    observer.observe(scene.current)
    observer.observe(anchor.current)
    return () => observer.disconnect()
  }, [landing])

  useLayoutEffect(() => {
    if (!motion) return
    const page = surface.current
    const done = () => {
      if (motion === 'out') panels.current[section].firstElementChild.scrollTop = 0
      setView({ ...view, landing: motion === 'in' ? false : landing, outgoing: null, motion: null })
    }

    if (!canAnimate(page)) {
      done()
      return
    }

    if (motion === 'slide') {
      const order = primaryLinks.map(({ path }) => path)
      const direction = Math.sign(order.indexOf(section) - order.indexOf(outgoing))
      const offset = (distance) => 'translate3d(' + distance + '%,0,0)'
      const leaving = panels.current[outgoing]
      const entering = panels.current[section]
      return finishAnimations([
        leaving.animate([{ transform: offset(0) }, { transform: offset(-direction * 100) }], slideOptions),
        entering.animate([{ transform: offset(direction * 100) }, { transform: offset(0) }], slideOptions),
      ], done)
    }

    const monitor = measureMonitor(scene.current, anchor.current)
    if (!monitor.visible) {
      done()
      return
    }

    const options = { ...zoomOptions, direction: motion === 'out' ? 'reverse' : 'normal' }
    function fade(layer, offset) {
      return layer.animate([{ opacity: 1 }, { opacity: 0, offset }, { opacity: 0 }], { ...options, easing: 'linear' })
    }

    return finishAnimations([
      page.animate([{ transform: monitor.preview }, { transform: monitor.full }], options),
      screenContent.current.animate([{ transform: 'scaleY(' + monitor.stretch + ')' }, { transform: 'scaleY(1)' }], options),
      fade(hero.current, 0.32),
      fade(shade.current, 0.66),
      fade(previewNav.current, 0.82),
    ], done)
  }, [view, landing, section, outgoing, motion])

  useLayoutEffect(() => {
    if (motion || (pathname === '/' ? !landing : landing || pathname !== section) ||
      focusedPath.current === pathname) return
    focusedPath.current = pathname
    const heading = landing ? hero.current.querySelector('h1') : panels.current[section].querySelector('h1')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus({ preventScroll: true })
  }, [pathname, landing, section, motion])

  return (
    <div ref={scene} className={landing ? 'page-journey gamefinder-home landing-scene' : 'page-journey'} data-zoom={motion === 'in' || motion === 'out' ? motion : undefined}>
      <Navbar currentPath={pathname} />
      <div className="landing-room" aria-hidden="true" hidden={!landing}>
        <div className="landing-room-shot">
          <img src={roomImage} alt="" fetchPriority={landing ? 'high' : 'low'} />
          <div className="landing-monitor-bezel">
            <div ref={anchor} className="landing-monitor-anchor" />
          </div>
        </div>
      </div>
      <div ref={hero} className="landing-content" hidden={!landing}>
        <main className="landing-hero" aria-labelledby="hero-title">
          <div className="home-shell">
            <div className="landing-copy">
              <h1 id="hero-title" className="landing-title" tabIndex={-1}>Find your next <span>favorite game.</span></h1>
              <p>Discover games that fit the way you play. Browse by genre or build your Steam and Nintendo libraries for personalized picks.</p>
              <div className="landing-actions">
                <a className="home-button home-button-primary" href="/recommendations">
                  Explore games <ArrowRight size={17} aria-hidden="true" />
                </a>
                <a className="home-button home-button-secondary" href="/library">
                  Open My Library <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
      <div ref={surface} className={'journey-surface' + (landing ? ' landing-monitor-view' : '')} inert={landing} aria-hidden={landing || undefined}>
        <div ref={screenContent} className={'journey-screen' + (landing ? ' landing-monitor-content' : '')}>
          <div className="monitor-navigation" ref={previewNav} hidden={!landing}>
            <Navbar currentPath={section} preview />
          </div>
          <div className="journey-viewport" data-sliding={motion === 'slide' || undefined}>
            {primaryLinks.map(({ path }) => {
              const active = path === section
              return (
                <div
                  key={path}
                  ref={(element) => { panels.current[path] = element }}
                  className="journey-panel"
                  data-route={path}
                  data-parked={(!active && path !== outgoing) || undefined}
                  inert={!active || Boolean(motion)}
                  aria-hidden={!active || undefined}
                >
                  <div className="journey-panel-scroll">
                    {path === defaultSection ? (
                      <DiscoverPanel preview={landing || !active} preferencesRevision={preferencesRevision} />
                    ) : path === '/library' ? (
                      <LibraryPanel onImported={refreshRecommendations} />
                    ) : <ContactPanel />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {landing && <div ref={shade} className="landing-monitor-shade" />}
      </div>
    </div>
  )
}
