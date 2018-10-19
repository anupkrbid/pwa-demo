// var CACHE_USER_REQUESTED_NAME = 'user-requested-v1';
var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var snackbar = document.querySelector('#confirmation-toast');
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(function() {
    createPostArea.style.transform = 'translateY(0)';
  }, 0);
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);
      if (choiceResult.outcome === 'dismissed') {
        console.log('User Cancelled Installation');
      } else {
        console.log('User Installed to Home Screen');
      }
    });
    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
  setTimeout(function() {
    createPostArea.style.display = 'none';
  }, 300);
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCard() {
  while (sharedMomentsArea.firstChild) {
    sharedMomentsArea.removeChild(sharedMomentsArea.firstChild);
  }
}

function createCard(post) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("' + post.image + '")';
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = post.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = post.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveCardHandler);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(posts) {
  clearCard();
  for (var i = 0; i < posts.length; i++) {
    createCard(posts[i]);
  }
}

var url = 'https://pwa-gram-app.firebaseio.com/posts.json';
var networkDataReceived = false;
fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(posts) {
    networkDataReceived = true;
    var data = [];
    for (key in posts) {
      var tmp = posts[key];
      tmp.id = key;
      data.push(tmp);
    }
    updateUI(data);
  });

if ('indexedDB' in window) {
  readDataAll('posts').then(function(data) {
    if (!networkDataReceived) {
      updateUI(data);
    }
  });
}

function sendData(data) {
  fetch('https://us-central1-pwa-gram-app.cloudfunctions.net/storePostData', {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application.json'
    },
    body: JSON.stringify(data)
  })
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      console.log('Sent Data', res);
      updateUI();
    });
}

// Currently not in use, Allows to cache data on demand
function onSaveCardHandler(event) {
  if ('caches' in window) {
    caches.open(CACHE_USER_REQUESTED_NAME).then(function(cache) {
      console.log('[Feed.js] Caching User Request ...');
      cache.addAll(['/src/images/sf-boat.jpg', 'https://httpbin.org/get']);
    });
  }
}

form.addEventListener('submit', function(event) {
  event.preventDefault();
  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please Enter Valid Data!');
    return;
  }
  closeCreatePostModal();
  var post = {
    id: new Date().toISOString(),
    title: titleInput.value.trim(),
    location: locationInput.value.trim(),
    image:
      'https://firebasestorage.googleapis.com/v0/b/pwa-gram-app.appspot.com/o/sf-boat.jpg?alt=media&token=3adcf68f-1444-4629-a32a-d982d209f338'
  };
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(function(sw) {
      writeData('sync-posts', post)
        .then(function() {
          return sw.sync.register('sync-new-posts');
        })
        .then(function() {
          var data = { message: 'Your Post Was saved for syncing!' };
          snackbar.MaterialSnackbar.showSnackbar(data);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
  } else {
    sendData(post);
  }
});
