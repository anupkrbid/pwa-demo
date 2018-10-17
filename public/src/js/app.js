var deferredPrompt;

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function() {
      console.log('Service Worker Registered!');
    })
    .catch(function(err) {
      console.log('Error while Service Worker Registation!', err);
    });
}

// Unregistring a Service Worker
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.getRegistrations().then(function(registrations) {
//     console.log('Service Worker Unregistering!');
//     registrations.forEach(function(registration) {
//       registration.unregister();
//     });
//   });
// }

window.addEventListener('beforeinstallprompt', function() {
  console.log('Before Install Prompt fired!');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});
