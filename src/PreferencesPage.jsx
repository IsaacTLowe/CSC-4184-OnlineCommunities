import { useState } from 'react'
import { BookOpen, Check, ChevronLeft, Compass, Ghost, Puzzle, Swords, Users } from 'lucide-react'
import { api } from './api.js'
import { genres } from './games.js'
import { usePlayerPreferences } from './preferences.js'

const genreIcons = { Combat: Swords, Exploration: Compass, Story: BookOpen, Puzzle, Horror: Ghost, Multiplayer: Users }

export default function PreferencesPage() {
  const { user, prefs, loading } = usePlayerPreferences()
  const [draft, setDraft] = useState(null)
  const [status, setStatus] = useState('editing')
  const [error, setError] = useState('')
  const selected = draft ?? prefs
  const fromLibrary = new URLSearchParams(window.location.search).get('from') === 'library'
  const backHref = fromLibrary ? '/library' : '/recommendations'

  function toggle(genre) {
    setDraft(selected.includes(genre) ? selected.filter((value) => value !== genre) : [...selected, genre])
  }

  async function save(event) {
    event.preventDefault()
    setStatus('saving')
    setError('')
    try {
      if (user) await api('/prefs', { method: 'PUT', body: { prefs: selected } })
      localStorage.setItem('prefs', JSON.stringify(selected))
      setStatus('saved')
    } catch {
      setError('Could not save your preferences. Please try again.')
      setStatus('editing')
    }
  }

  return (
    <main className={status === 'saved' ? 'preferences-page preferences-page-saved' : 'preferences-page'}>
      <div className="preferences-shell">
        {status === 'saved' ? (
          <section className="preferences-confirmation" aria-labelledby="preferences-saved">
            <span className="preferences-check"><Check size={25} aria-hidden="true" /></span>
            <h1 id="preferences-saved" tabIndex={-1} ref={(heading) => heading?.focus()}>Preferences saved</h1>
            <p>Your recommendations have been updated.</p>
            <a className="home-button home-button-primary" href="/recommendations">See recommendations</a>
          </section>
        ) : (
          <form onSubmit={save} aria-labelledby="preferences-title">
            <a className="preferences-back" href={backHref}>
              <ChevronLeft size={21} aria-hidden="true" /> Back
            </a>
            <h1 id="preferences-title">Game preferences</h1>
            <p className="preferences-description">Choose the genres you want to see in your recommendations.</p>
            <fieldset className="preferences-list" disabled={loading || status === 'saving'}>
              <legend className="sr-only">Preferred genres</legend>
              {genres.map((genre) => {
                const Icon = genreIcons[genre]
                return (
                  <label key={genre} className="preferences-option">
                    <span className="preferences-genre">
                      <span className="preferences-genre-icon"><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span>
                      {genre}
                    </span>
                    <input
                      className="preferences-switch"
                      type="checkbox"
                      role="switch"
                      checked={selected.includes(genre)}
                      onChange={() => toggle(genre)}
                    />
                  </label>
                )
              })}
            </fieldset>
            {error && <p className="preferences-error" role="alert">{error}</p>}
            <div className="preferences-actions">
              <p>Keep at least one genre enabled.</p>
              <button className="home-button home-button-primary" disabled={loading || !selected.length || status === 'saving'} type="submit">
                {status === 'saving' ? 'Saving…' : 'Save preferences'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}