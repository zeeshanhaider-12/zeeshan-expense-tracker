const CACHE_NAME = 'family-budget-v1'
const SHELL_FILES = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key)
          return null
        }),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request)
        .then((response) => {
          // Cache same-origin successful responses for offline reuse.
          if (event.request.url.startsWith(self.location.origin) && response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(async () => {
          // SPA fallback for navigations when offline.
          if (event.request.mode === 'navigate') {
            const fallback = await caches.match('/index.html')
            if (fallback) return fallback
          }
          throw new Error('Offline and no cached response available.')
        })
    }),
  )
})
