import { useEffect, useState } from 'react'
import { api, getMe } from './api.js'

const card = 'rounded-3xl border border-[#392525]/10 bg-[#FAF5E9] shadow-xl shadow-[#392525]/5'

const button =
  'inline-flex items-center justify-center rounded-xl bg-[#392525] px-6 py-3 font-semibold text-[#FAF5E9] shadow-sm transition hover:bg-[#392525]/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#392525] disabled:opacity-50'

const secondaryButton =
  'inline-flex items-center justify-center rounded-xl border border-[#392525]/20 bg-[#FAF5E9] px-6 py-3 font-semibold text-[#392525] shadow-sm transition hover:bg-[#392525]/5'

const input =
  'mt-1 w-full rounded-xl border border-[#392525]/20 bg-[#FAF5E9] px-4 py-3 text-[#392525] transition focus:border-[#392525] focus:ring-4 focus:ring-[#392525]/15 focus:outline-none'

export default function LoginPage() {
  const [user, setUser] = useState(null)

  // Already logged in? Skip straight to the optional Steam step.
  useEffect(() => {
    getMe().then(setUser)
  }, [])

  return (
    <main className="flex flex-1 justify-center bg-[#FAF5E9] px-4 py-12 text-[#392525]">
      {user ? <ConnectSteam user={user} /> : <AccountForm />}
    </main>
  )
}

function AccountForm() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(`/${mode}`, { method: 'POST', body: { username, password } })
      window.location.reload() // so the navbar shows the logged-in user too; the page then shows the Steam step
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const registering = mode === 'register'

  return (
    <form className={`${card} h-fit w-full max-w-md p-8 sm:p-10`} onSubmit={submit}>
      <h1 className="text-center text-3xl font-bold tracking-tight">{registering ? 'Create Account' : 'Log In'}</h1>
      <p className="mt-2 text-center text-[#392525]/70">
        {registering ? 'Sign up to save your preferences.' : 'Welcome back! Log in to see your recommendations.'}
      </p>

      <label className="mt-8 block font-medium">
        Username
        <input className={input} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
      </label>
      <label className="mt-4 block font-medium">
        Password
        <input
          className={input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={registering ? 'new-password' : 'current-password'}
          required
        />
      </label>

      {error && <p className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}

      <button className={`${button} mt-8 w-full`} type="submit" disabled={busy}>
        {registering ? 'Create Account' : 'Log In'}
      </button>
      <button
        className="mt-4 w-full text-sm font-medium text-[#392525]/70 underline-offset-4 hover:underline"
        type="button"
        onClick={() => {
          setMode(registering ? 'login' : 'register')
          setError('')
        }}
      >
        {registering ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </form>
  )
}

function ConnectSteam({ user }) {
  const steamFailed = new URLSearchParams(window.location.search).get('steam') === 'failed'

  return (
    <div className={`${card} h-fit w-full max-w-md p-8 text-center sm:p-10`}>
      <h1 className="text-3xl font-bold tracking-tight">Hi, {user.username}!</h1>
      {user.steamId ? (
        <p className="mt-2 text-[#392525]/70">Your Steam account is connected.</p>
      ) : (
        <p className="mt-2 text-[#392525]/70">
          Want better recommendations? Sign in with Steam and we'll set your preferences from the games you play.
        </p>
      )}

      {steamFailed && (
        <p className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">
          Steam sign-in failed. Please try again.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {/* Full page navigation (not fetch): the server redirects to Steam's login page. */}
        <a className={button} href={user.steamId ? '/library' : '/api/steam/login'}>
          {user.steamId ? 'Re-import Steam Library' : 'Sign in with Steam'}
        </a>
        <a className={secondaryButton} href="/recommendations">
          {user.steamId ? 'See Recommendations' : 'Skip for now'}
        </a>
      </div>
    </div>
  )
}
