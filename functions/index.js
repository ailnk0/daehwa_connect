const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require(
    "daehwa-connect-firebase-adminsdk-9pqmd-4162e53b6a.json"
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// exports.createAlert = functions.region('asia-northeast3')
// .firestore.document('chatroom/{docid}').onCreate((snapshot, context) => {
//     db.collection('user').doc(who[0]).update({ alert : '어떤놈이 채팅검' })
//     db.collection('user').doc(who[1]).update({ alert : '어떤놈이 채팅검' })
// });
