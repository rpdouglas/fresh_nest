// The service worker's source, written at build time by the plugin in vite.config.ts (decision 0043).
// It keeps the app's own files so the installed app opens with no signal, and never keeps data: anything under
// /api/ always goes to the network. A new build has a new file list, so a new version, which replaces the old
// files when it takes over.

/** Files kept besides the build's own: the page itself, the manifest and the icons in public/. */
export const ALWAYS_KEPT = ['/', '/manifest.webmanifest', '/pwa-icon-192.png', '/pwa-icon-512.png', '/pwa-maskable-512.png', '/apple-touch-icon.png']

/** A short version that changes whenever the list of files changes. */
export function versionOf(files: readonly string[]): string {
  let h = 5381
  for (const c of [...files].sort().join('\n')) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return h.toString(36)
}

/** The service worker for a build whose files (paths from the site's root, e.g. "assets/index-abc.js") are given. */
export function serviceWorkerSource(buildFiles: readonly string[]): string {
  const files = [...ALWAYS_KEPT, ...buildFiles.filter((f) => f.startsWith('assets/')).map((f) => `/${f}`)]
  const version = versionOf(files)
  return `// Written by the build (web/src/lib/serviceWorker.ts). Version ${version}.
const KEEP = 'fnc-app-${version}'
const FILES = ${JSON.stringify(files)}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(KEEP).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('fnc-app-') && n !== KEEP).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // data is never kept: it goes to the network, and fails there with no signal
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate') {
    // the page from the network when there is one, so a new build shows at once; the kept one with no signal
    event.respondWith(fetch(request).catch(() => caches.match('/', { cacheName: KEEP })))
    return
  }
  event.respondWith(caches.match(request, { cacheName: KEEP }).then((kept) => kept || fetch(request)))
})
`
}
