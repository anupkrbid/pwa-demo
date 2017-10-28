if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function() {
      console.log('Service Worker Registered!');
    });
}

window.addEventListener('beforeinstallprompt', function () {
  console.log('Before Install Prompt fired!');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});