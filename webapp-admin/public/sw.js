// Network-first with cache fallback (same strategy as expense-manager).
// Bump CACHE_NAME on deploy to invalidate old caches.
const CACHE_NAME = 'tv-v1'
const STATIC_URLS = ['/', '/companies/', '/dealers/', '/qr/', '/offline/']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_URLS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  // Never cache Firebase/Google API traffic — always live data.
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(req)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(req, clone))
        return res
      })
      .catch(() => {
        if (req.mode === 'navigate') return caches.match(req).then((r) => r || caches.match('/offline/'))
        return caches.match(req)
      })
  )
})
