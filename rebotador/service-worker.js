const VERSION = new URL(self.location.href).searchParams.get("v") || "1.0.1.h";
const CACHE_NAME = `rebotador-${VERSION}`;

const APP_ASSETS = [
  "./",
  "./index.html",
  "./css/estilos.css",
  "./js/configuracionExcel.js",
  "./js/configuracion.js",
  "./js/persistencia.js",
  "./js/playasEspeciales.js",
  "./js/vehiculos.js",
  "./js/sonidos.js",
  "./js/scanner.js",
  "./js/ubicaciones.js",
  "./js/exportacion.js",
  "./js/version.js",
  "./js/app.js",
  "./img/icon-192.png",
  "./img/icon-512.png",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith("rebotador-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (
          response &&
          response.status === 200 &&
          new URL(event.request.url).origin === self.location.origin
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, clone)
          );
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
