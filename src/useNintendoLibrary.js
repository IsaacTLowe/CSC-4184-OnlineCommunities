import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { libraryEvent, libraryKey, parseLibrary, updateLibrary } from './nintendoStorage.js'

function subscribe(listener) {
  window.addEventListener('storage', listener)
  window.addEventListener(libraryEvent, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(libraryEvent, listener)
  }
}

export function useNintendoLibrary(user) {
  const key = libraryKey(user)
  const snapshot = useCallback(() => {
    try { return key ? localStorage.getItem(key) ?? '[]' : '[]' }
    catch { return '[]' }
  }, [key])
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]')
  const entries = useMemo(() => parseLibrary(raw), [raw])
  function save(gameId, changes) {
    if (!key) throw new Error('Please wait for your account to load.')
    // Re-read before writing so updates do not overwrite a more recent edit.
    const next = updateLibrary(localStorage.getItem(key), gameId, changes)
    localStorage.setItem(key, JSON.stringify(next))
    window.dispatchEvent(new Event(libraryEvent))
  }
  return { entries, save, loading: !key }
}
