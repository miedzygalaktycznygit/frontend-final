// Wczytujemy biblioteki dla 'app' i 'messaging'
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js");

// Ten obiekt jest poprawny
const firebaseConfig = {
    apiKey: "AIzaSyDpEuaL4XizM242E7XZLpI5P2iYrmoGxyQ",
    authDomain: "powiadomienia-strona-firmy.firebaseapp.com",
    projectId: "powiadomienia-strona-firmy",
    storageBucket: "powiadomienia-strona-firmy.firebasestorage.app",
    messagingSenderId: "360455636841",
    appId: "1:360455636841:web:66981a7810b153849f1ff8",
    measurementId: "G-4WHBQ0BQJK"
  };

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Otrzymano wiadomość w tle: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});