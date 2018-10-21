const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webPush = require('web-push');

const serviceAccount = require('./pwa-gram-app-firebase-adminsdk-28yyt-c90b9e3d32.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwa-gram-app.firebaseio.com'
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    const body = {
      title: request.body.title,
      location: request.body.location,
      image: request.body.image
    };
    admin
      .database()
      .ref('posts')
      .push(body)
      .then(res => {
        webPush.setVapidDetails(
          'mailto:anup.blade@gmail.com',
          'BOCBH13iUOSc9CftQG6IcLwaKwxJds9S7fEbNioMhdjpE7AGyn0r1j5_1JqeSGU3YjqvfGx1_sSNiXZZKQK_K4I',
          'M2S8Bu6SPtkvs_-ZTHPI3NK0bbLVpSdjgWIA7DGNxww'
        );
        return admin
          .database()
          .ref('subscriptions')
          .once('value');
      })
      .then(function(subscriptions) {
        subscriptions.forEach(function(sub) {
          var pushConfig = sub.val();
          webPush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: 'New Post',
                content: 'New Post Added',
                openUrl: '/help'
              })
            )
            .catch(function(err) {
              console.log('WebPushError', err);
            });
        });
        response.status(201).json({ res: res, id: request.body.id });
      })
      .catch(err => {
        response.status(500).json({ err: err });
      });
  });
});
