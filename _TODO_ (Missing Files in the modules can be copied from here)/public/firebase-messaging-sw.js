// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyD9xbEpS5pPQ6X3PggFoAP1c9gPoO4wN28",
    authDomain: "dbedc-erp.firebaseapp.com",
    projectId: "dbedc-erp",
    storageBucket: "dbedc-erp.appspot.com",
    messagingSenderId: "551140686722",
    appId: "1:551140686722:web:d99b8829aad35e60232d9b",
    measurementId: "G-GRR20JHLW3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
    console.log(notificationTitle, notificationOptions)
});
