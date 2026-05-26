const CACHE_NAME = 'reporank-v2'
const STATIC_ASSETS = [
  '/',
  '/faq',
]

const isGetRequest = (method) => method === 'GET'

const isSameOrigin = (url) =>
  url.origin === self.location.origin

const isNavigation = (url) =>
  url.pathname === '/' || url.pathname === '/faq'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (!isGetRequest(request.method)) return

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          return response
        })
        return cached ?? fetchPromise
      })
    )
    return
  }

  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  if (isSameOrigin(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached ?? fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          return response
        })
      })
    )
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
})
