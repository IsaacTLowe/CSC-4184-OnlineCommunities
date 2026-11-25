import { useEffect, useState } from 'react'
import { getMe } from './api.js'
import { genres } from './games.js'

const defaultPreferences = ['Combat']

function readLocalPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem('prefs'))
    return Array.isArray(stored) && stored.length > 0 && stored.every((genre) => genres.includes(genre))
      ? stored
      : defaultPreferences
  } catch {
    return defaultPreferences
  }
}

export function usePlayerPreferences(revision) {
  const [user, setUser] = useState(undefined)
  const [localPreferences] = useState(readLocalPreferences)

  useEffect(() => {
    let active = true
    getMe().then((player) => {
      if (active) setUser(player)
    })
    return () => { active = false }
  }, [revision])

  return { user, prefs: user?.prefs ?? localPreferences, loading: user === undefined }
}
