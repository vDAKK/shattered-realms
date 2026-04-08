// ═══════════════════════════════════════════════════════
//  SHATTERED REALMS : Service Worker
//  Stratégie : Cache-first pour les assets locaux,
//              Network-first pour Phaser CDN
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'shattered-realms-v2';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './src/main.js',
  './src/data/narrative.js',
  './src/data/upgrades.js',
  './src/data/levels.js',
  './src/scenes/BootScene.js',
  './src/scenes/MenuScene.js',
  './src/scenes/NarrativeScene.js',
  './src/scenes/GameScene.js',
  './src/scenes/UpgradeScene.js',
  './src/scenes/GameOverScene.js',
  './src/scenes/VictoryScene.js',
];

const PHASER_CDN = 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js';

// ── Install : pré-cache tous les assets locaux ──────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache local assets
      await cache.addAll(LOCAL_ASSETS);
      // Tente de cacher Phaser CDN (nécessite internet au premier chargement)
      try {
        const response = await fetch(PHASER_CDN, { mode: 'cors' });
        await cache.put(PHASER_CDN, response);
      } catch {}
    })
  );
  self.skipWaiting();
});

// ── Activate : nettoyage des anciens caches ─────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : stratégie hybride ───────────────────────────
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Assets locaux → cache-first
  if (LOCAL_ASSETS.some((a) => url.endsWith(a.replace('./', ''))) || url.includes('/src/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Phaser CDN → network-first, fallback cache
  if (url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Fonts Google → stale-while-revalidate
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        }).catch(() => {});
        return cached || network;
      })
    );
  }
});
