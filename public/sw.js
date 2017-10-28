self.addEventListener('install', function(event) {
  console.log('[SW] ~ Installing Service Worker ...', event);
});

self.addEventListener('activate', function(event) {
  console.log('[SW] ~ Activating Service Worker ...', event);
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  console.log('[SW] ~ Fetching assets ...', event);
  event.respondWith(fetch(event.request));
});