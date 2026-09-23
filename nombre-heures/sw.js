const CACHE_NAME = 'boussole-heures';
const ASSETS = [
  './exercice_heures.html',
  './manifest.json',
  './icon.png',
  './icon-512.png'
];

// 1. Installation : Mise en cache immédiate de l'exercice
self.addEventListener('install', (e) => {
  // Force le Service Worker à devenir actif immédiatement sans attendre
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Nettoyage : Supprime les anciens caches si vous changez de version (ex: v2)
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
    })
  );
});

// 3. Stratégie : CACHE D'ABORD pour un chargement instantané sans réseau
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Si le fichier est dans le cache, on le sert immédiatement
      if (cachedResponse) {
        return cachedResponse;
      }
      // Sinon, on va le chercher sur le réseau (sécurité)
      return fetch(e.request);
    })
  );
});