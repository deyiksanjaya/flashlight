// A unique name for the cache. Change this name whenever you update the cached files
// to ensure the new version is downloaded.
const CACHE_NAME = 'nocturnal-v5'; // Increased version to trigger an update

// The list of files and resources to be cached upon installation.
// These URLs are now aligned with your latest manifest.json and folder structure.
const URLS_TO_CACHE = [
  '/control/',              // ADDED: The root of the PWA scope
  '/control/app.html',      // Main application page
  '/control/manifest.json', // Manifest file path
  '/icons/icon192.png',     // New 192x192 icon
  '/icons/icon512.png',     // New 512x512 icon
  
  // Assets from CDN (optional but highly recommended for offline performance)
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://img.icons8.com/pastel-glyph/64/shutdown--v1.png'
];

// 'install' event: Fired when the service worker is first installed.
// We open the cache and store all necessary assets.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened, caching assets...');
        // Using { cache: 'reload' } to ensure we get the latest files from the network during install.
        const cachePromises = URLS_TO_CACHE.map(url => {
            return fetch(new Request(url, { cache: 'reload' }))
                .then(response => cache.put(url, response));
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('Service Worker: All assets successfully cached.');
        return self.skipWaiting(); // Force the new service worker to become active
      })
  );
});

// 'activate' event: Fired after installation is complete and the service worker is active.
// Here we clean up old caches to prevent them from piling up.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If a cache's name doesn't match the current one, delete it.
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Ready to control clients.');
        return self.clients.claim(); // Take over control of any open pages
    })
  );
});

// 'fetch' event: Fired every time the app makes a network request (e.g., for images, scripts).
// We implement a "Cache First" strategy with a fallback for the main app page.
self.addEventListener('fetch', (event) => {
  // We only apply the cache strategy for GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests (opening the app), handle them specially.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First, try to fetch from the network. This ensures users get the latest version if they are online.
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // If the network fails (offline), serve the main app page from the cache.
          console.log('Network request failed, serving app shell from cache.');
          const cache = await caches.open(CACHE_NAME);
          // Always serve app.html for any navigation failure.
          return await cache.match('/control/app.html');
        }
      })()
    );
    return;
  }
  
  // For non-navigation requests (assets like images, scripts), use a Cache First strategy.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If a response is found in the cache, return it.
        if (response) {
          return response;
        }
        
        // If it's not in the cache, try to fetch it from the network.
        return fetch(event.request);
      })
  );
});
