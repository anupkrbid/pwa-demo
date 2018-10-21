importScripts('/src/js/lib/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v2';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/js/lib/promise.js',
  '/src/js/lib/fetch.js',
  '/src/js/lib/idb.js',
  '/src/js/lib/material.min.js',
  '/src/js/utility.js',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/images/main-image.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

function isInArray(str, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == str) {
      return true;
    }
  }
  return false;
}

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName).then(function(cache) {
//     return cache.keys().then(function(keys) {
//       if (keys.length > maxItem) {
//         cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
//       }
//     });
//   });
// }

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
  var url = 'https://pwa-gram-app.firebaseio.com/posts.json';
  if (event.request.url.indexOf(url) > -1) {
    // Cache then network Stratergy
    event.respondWith(
      fetch(event.request).then(function(res) {
        // trimCache(CACHE_DYNAMIC_NAME, 10);
        var clonedRes = res.clone();
        clearDataAll('posts')
          .then(function() {
            return clonedRes.json();
          })
          .then(function(posts) {
            for (key in posts) {
              var tmp = posts[key];
              tmp.id = key;
              writeData('posts', tmp);
            }
          });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
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
                // trimCache(CACHE_DYNAMIC_NAME, 10);
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(function(err) {
              return caches.open(CACHE_STATIC_NAME).then(function(cache) {
                if (event.request.headers.get('accept').includes('text/html')) {
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

self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background Syncing ...');
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing New Post...');
    event.waitUntil(
      readDataAll('sync-posts').then(function(records) {
        console.log(records);
        for (var record of records) {
          fetch(
            'https://us-central1-pwa-gram-app.cloudfunctions.net/storePostData',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application.json'
              },
              body: JSON.stringify(record)
            }
          )
            .then(function(res) {
              return res.json();
            })
            .then(function(data) {
              console.log('Data Synced', data);
              clearData('sync-posts', data.id);
            })
            .catch(function(err) {
              console.log('Error while Syncing Data', err);
            });
        }
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  var notification = event.notification;
  var action = event.action;

  console.log(notification);

  if (action === 'confirm') {
    console.log('confirm was chosen');
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then(function(cli) {
        var client = cli.find(function(c) {
          return c.visibilityState === 'visible';
        });

        if (client !== undefined) {
          client.navigate(notification.data.url);
        } else {
          client.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification was closed');
  console.log(event.notification);
});

self.addEventListener('push', function(event) {
  console.log('Push Notification Received');

  var data = {
    title: 'New!',
    content: 'Something New!',
    openUrl: '/'
  };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }
  var option = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
