// Offline reading for the Infinite Mage reader.
// - Chapter pages: served from cache immediately, refreshed in the background.
// - Home page: network first (so new chapters show up), cache when offline.
// - /_next/static assets: cache first (file names are content-hashed).
// - "save-all" message from the home page downloads every chapter page.
const CACHE = 'im-offline-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    await self.clients.claim()
  })())
})

const pathKey = (url) => new URL(url, self.location.origin).pathname

async function put(cache, path, response) {
  if (response && response.ok && response.type === 'basic') await cache.put(path, response.clone())
  return response
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(pathKey(request.url))
  if (hit) return hit
  return put(cache, pathKey(request.url), await fetch(request))
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(CACHE)
  const path = pathKey(event.request.url)
  const hit = await cache.match(path)
  const refresh = fetch(event.request).then(r => put(cache, path, r)).catch(() => null)
  if (hit) {
    event.waitUntil(refresh)
    return hit
  }
  return (await refresh) || offlinePage()
}

async function networkFirst(request, timeoutMs) {
  const cache = await caches.open(CACHE)
  const path = pathKey(request.url)
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ])
    return put(cache, path, response)
  } catch {
    return (await cache.match(path)) || offlinePage()
  }
}

function offlinePage() {
  return new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="background:#0d0d0d;color:#e2e2e2;font-family:system-ui;padding:48px 24px;max-width:560px;margin:auto">' +
    '<h1 style="font-weight:400;font-family:Georgia,serif">Not saved for offline</h1>' +
    '<p style="color:#888;line-height:1.6">This chapter was not downloaded before you went offline. ' +
    'Next time you are online, open the home page and tap "Save all chapters for offline".</p>' +
    '<p><a href="/" style="color:#818cf8">Back to chapters</a></p></body>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
  } else if (request.mode === 'navigate' && url.pathname.startsWith('/chapter/')) {
    event.respondWith(staleWhileRevalidate(event))
  } else if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(networkFirst(request, 3000))
  }
})

// Download every page the home page lists, plus the scripts and styles they use.
async function saveAll(urls, client) {
  const cache = await caches.open(CACHE)
  const assets = new Set()
  let saved = 0
  let i = 0
  async function worker() {
    while (i < urls.length) {
      const path = urls[i++]
      try {
        const response = await fetch(path, { cache: 'no-cache' })
        if (response.ok) {
          const html = await response.clone().text()
          for (const m of html.matchAll(/\/_next\/static\/[^"'\s)]+/g)) assets.add(m[0])
          await cache.put(path, response)
          if (path.startsWith('/chapter/')) saved++
          if (saved % 5 === 0) client?.postMessage({ type: 'save-progress', saved })
        }
      } catch {
        // offline or flaky: skip this one, the button can be pressed again
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  await Promise.all([...assets].map(async (a) => {
    if (await cache.match(a)) return
    try { await put(cache, a, await fetch(a)) } catch {}
  }))
  client?.postMessage({ type: 'save-done', saved })
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'save-all') {
    event.waitUntil(saveAll(event.data.urls || [], event.source).catch((err) => {
      event.source?.postMessage({ type: 'save-error', message: String(err) })
    }))
  }
})
