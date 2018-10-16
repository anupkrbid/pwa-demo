var CACHE_STATIC_NAME = 'static-v1';
var CACHE_DYNAMIC_NAME = 'dynamic-v1';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/lib/fetch.js',
  '/src/js/lib/promise.js',
  '/src/js/lib/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(function(cache) {
      console.log('[Service Worker] Pre Caching App Shell ...');
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Revoming Old Cache ....', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Cache then Network Stratergy combined with Custom Stratergy and Cache Only Stratergy
self.addEventListener('fetch', function(event) {
  var url = 'https://httpbin.org/get';
  if (event.request.url.indexOf(url) > -1) {
    // Cache then network Stratergy
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
        return fetch(event.request).then(function(res) {
          cache.put(event.request.url, res.clone());
          return res;
        });
      })
    );
  } else if (
    new RegExp('\\b' + STATIC_FILES.join('\\b|\\b') + '\\b').test(
      event.request.url
    )
  ) {
    // Cache Only Stratergy
    return event.respondWith(caches.match(event.request));
  } else {
    // Custom Stratergy
    event.respondWith(
      caches.match(event.request).then(function(response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function(res) {
              caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(function(err) {
              return caches.open(CACHE_STATIC_NAME).then(function(cache) {
                if (event.request.url.indexOf('/help') > -1) {
                  return caches.match('offline.html');
                }
              });
            });
        }
      })
    );
  }
});

// Custom Stratergy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request).then(function(response) {
//       if (response) {
//         return response;
//       } else {
//         return fetch(event.request)
//           .then(function(res) {
//             caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
//               cache.put(event.request.url, res.clone());
//               return res;
//             });
//           })
//           .catch(function(err) {
//             return caches.open(CACHE_STATIC_NAME).then(function(cache) {
//               return caches.match('offline.html');
//             });
//           });
//       }
//     })
//   );
// });

// Cache then Network Stratergy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
//       return fetch(event.request).then(function(res) {
//         cache.put(event.request.url, res.clone());
//         return res;
//       });
//     })
//   );
// });

// Network with Cache Fallback Stratergy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function(res) {
//         caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
//           cache.put(event.request.url, res.clone());
//           return res;
//         });
//       })
//       .catch(function(err) {
//         caches.match(event.request).catch(function(err) {
//           return caches.open(CACHE_STATIC_NAME).then(function(cache) {
//             return caches.match('offline.html');
//           });
//         });
//       })
//   );
// });

// Cache Only Stratergy
// self.addEventListener('fetch', function(event) {
//   return event.respondWith(caches.match(event.request));
// });

// Network Only Stratergy
// self.addEventListener('fetch', function(event) {
//   return event.respondWith(event.request);
// });
