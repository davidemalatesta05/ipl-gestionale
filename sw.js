/* IPL Gestionale v8 — service worker: app installabile e funzionamento senza internet */
const CACHE = 'ipl-v9.02';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'favicon-64.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'Guida_IPL_Gestionale.html'];
/* v9.02: librerie messe nella cartella vendor/ del sito (facoltative: se mancano il programma usa il CDN e qui non succede nulla) */
const VENDOR = ['vendor/leaflet.js', 'vendor/leaflet.css', 'vendor/xlsx.full.min.js', 'vendor/images/layers.png', 'vendor/images/layers-2x.png', 'vendor/images/marker-icon.png', 'vendor/images/marker-icon-2x.png', 'vendor/images/marker-shadow.png'];
const putIfOk = (c, u) => fetch(u, { cache: 'no-store' }).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {});
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(() => Promise.all(VENDOR.map(u => putIfOk(c, u)))))); });
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
      const vendor = url.pathname.includes('/vendor/');
      e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => { if (vendor && resp.ok) { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return resp; })));
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
