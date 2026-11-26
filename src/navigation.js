export const primaryLinks = [
  { path: '/recommendations', label: 'Discover' },
  { path: '/library', label: 'Library' },
  { path: '/contact', label: 'Contact Us' },
]

export const defaultSection = primaryLinks[0].path

export function isPrimaryPath(path) {
  return path === '/' || primaryLinks.some((link) => link.path === path)
}

export function locationPath(url = window.location) {
  const path = url.pathname.replace(/\/+$/, '') || '/'
  return path === '/' && url.hash === '#discover' ? defaultSection : path
}
