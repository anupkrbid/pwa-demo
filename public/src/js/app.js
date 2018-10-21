var deferredPrompt;
var enableNotifications = document.querySelectorAll('.enable-notifications');

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

function displayConfirmNotification() {
  var options = {
    body: 'You successfully subscribed to our notification service',
    icon: '/src/images/icon/app-icon-96x96.png',
    image: '/src/images/sf-boat.jpg',
    dir: 'ltr',
    lang: 'en-US', // BCP 47
    vibrate: [100, 50, 200], // [play, pause, play, ..] (ms)
    badge: '/src/images/icon/app-icon-96x96.png',
    tag: 'confirm-notification',
    renotify: true,
    actions: [
      {
        action: 'confirm',
        title: 'Okay',
        icon: '/src/images/icon/app-icon-96x96.png'
      },
      {
        action: 'cancel',
        title: 'Cancel',
        icon: '/src/images/icon/app-icon-96x96.png'
      }
    ]
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function(sw) {
      sw.showNotification('Successfully Subscribed', options);
    });
  }
  // new Notification('Successfully Subscribed', options);
}

function confirmPushSub() {
  var reg;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(function(sw) {
        reg = sw;
        return sw.pushManager.getSubscription();
      })
      .then(function(sub) {
        console.log(sub);
        if (sub == null) {
          // Create a new subscription
          var vapidPublicKey =
            'BOCBH13iUOSc9CftQG6IcLwaKwxJds9S7fEbNioMhdjpE7AGyn0r1j5_1JqeSGU3YjqvfGx1_sSNiXZZKQK_K4I';
          var converterVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
          return reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: converterVapidPublicKey
          });
        } else {
          return null;
          // We already have a subscription
          // M2S8Bu6SPtkvs_-ZTHPI3NK0bbLVpSdjgWIA7DGNxww
        }
      })
      .then(function(newSub) {
        return fetch('https://pwa-gram-app.firebaseio.com/subscriptions.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(newSub)
        });
      })
      .then(function(res) {
        if (res.ok) {
          displayConfirmNotification();
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  }
}

function requestNotificatoinPermissionHandler() {
  Notification.requestPermission(function(result) {
    console.log('User Choice: ', result);
    if (result !== 'granted') {
      console.log('No Notigfication Permission granted ');
    } else {
      confirmPushSub();
    }
  });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  enableNotifications.forEach(function(notification) {
    notification.style.display = 'inline-block';
    notification.addEventListener(
      'click',
      requestNotificatoinPermissionHandler
    );
  });
}
