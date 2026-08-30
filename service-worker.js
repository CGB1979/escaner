const VERSION =
  new URL(self.location.href).searchParams.get('v') || '1.0.0';

const CACHE_NAME = `control-playa-${VERSION}`;

const APP_ASSETS = [
  './',
  './index.html',
  './css/estilos.css',

  './js/configuracion.js',
  './js/modal.js',
  './js/playasEspeciales.js',
  './js/numeracion.js',
  './js/vehiculos.js',
  './js/scanner.js',
  './js/ubicaciones.js',
  './js/exportacion.js',
  './js/version.js',
  './js/app.js',

  './img/icon-192.png',
  './img/icon-512.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_ASSETS)
    )
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(
            key =>
              key.startsWith('control-playa-') &&
              key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
