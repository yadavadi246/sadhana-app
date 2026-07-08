const CACHE_NAME = 'sadhana-v2';
const ASSETS = [
  './',
  './index.html',
  './src/index.css',
  './src/main.js',
  './src/html.js',
  './src/App.js',
  './src/utils/storage.js',
  './src/components/Hero.js',
  './src/components/StatsStrip.js',
  './src/components/BadgesRow.js',
  './src/components/WeeklyChart.js',
  './src/components/Timeline.js',
  './src/components/ExportModal.js',
  './src/components/ReportCard.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://esm.sh/preact@10.19.2',
  'https://esm.sh/preact@10.19.2/hooks',
  'https://esm.sh/htm@3.1.1',
  'https://esm.sh/html2canvas@1.4.1',
  'https://esm.sh/jspdf@2.5.1'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (e.request.url.startsWith('http')) {
            cache.put(e.request, response.clone());
          }
          return response;
        });
      });
    }).catch(() => {
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
