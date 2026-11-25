// Tiny fetch wrapper for our backend. Throws with the server's error message.
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  // No JSON back means the request never reached our server (usually it isn't running,
  // so the Vite proxy answers with an empty error instead).
  if (data === null) throw new Error("Can't reach the server. Is `npm run server` running?")
  if (!res.ok) {
    const error = new Error(data.error ?? 'Something went wrong')
    error.status = res.status
    throw error
  }
  return data
}

// Returns the logged-in user ({ username, steamId, prefs, ownedAppIds }) or null.
export const getMe = () => api('/me').then((d) => d.user).catch(() => null)
