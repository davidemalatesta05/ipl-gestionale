/* IPL Gestionale v8 — service worker: app installabile e funzionamento senza internet */
const CACHE = 'ipl-v8.04';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'favicon-64.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'Guida_IPL_Gestionale.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ipl-v') && k !== CACHE).map(k => caches.delete(k)))));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
    if (page) {
      e.respondWith(fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    } else {
      e.respondWith(caches.match(req).then(r => r || fetch(req)));
    }
    return;
  }
  if (/^(unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(url.hostname)) {
    e.respondWith(caches.open('ipl-cdn').then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
  // server Supabase e mappe: sempre dalla rete (i dati non passano mai dalla cache)
});
