const CACHE_NAME = "francais-phrases-v2";

const APP_SHELL = [
  "./exercice_phrases.html",
  "./manifest.json",
  "./phrases.json",
  "./icon.png",
  "./icon-512.png"
];

// Installation : précharge l'application pour permettre son ouverture hors ligne.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activation : supprime les anciens caches.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// La page et le JSON sont vérifiés sur le réseau en priorité.
// En cas de panne ou hors connexion, la dernière copie en cache est utilisée.
self.addEventListener("fetch", event => {
  const request = event.request;

  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  const url = new URL(request.url);
  const isPhrases = url.pathname.endsWith("/phrases.json");
  const isPage = request.mode === "navigate";

  if (isPhrases || isPage) {
    event.respondWith(
      fetch(request, { cache: "no-cache" })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);

          if (cached) return cached;

          if (isPage) {
            return (
              await caches.match("./exercice_phrases.html")
            ) || new Response(
              "Application indisponible hors connexion.",
              {
                status: 503,
                headers: {
                  "Content-Type": "text/plain; charset=utf-8"
                }
              }
            );
          }

          return new Response(
            "Fichier de phrases indisponible.",
            { status: 503 }
          );
        })
    );

    return;
  }

  // Pour les icônes et autres ressources statiques : cache d'abord.
  event.respondWith(
    caches.match(request).then(
      cached => cached || fetch(request)
    )
  );
});
