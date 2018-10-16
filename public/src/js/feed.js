// var CACHE_USER_REQUESTED_NAME = 'user-requested-v1';
var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var sharedMomentsArea = document.querySelector('#shared-moments');
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);

function openCreatePostModal() {
  createPostArea.style.display = 'block';
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
  createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCard() {
  while (sharedMomentsArea.firstChild) {
    sharedMomentsArea.removeChild(sharedMomentsArea.firstChild);
  }
}

function createCard() {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = 'San Francisco Trip';
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = 'In San Francisco';
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveCardHandler);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

var url = 'https://httpbin.org/get';
var networkDataReceived = false;
fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    clearCard();
    createCard();
  });

if ('caches' in window) {
  caches
    .match(url)
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      if (!networkDataReceived) {
        clearCard();
        createCard();
      }
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
