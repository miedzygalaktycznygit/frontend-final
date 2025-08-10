import { initializeApp } from "firebase/app";
// Potrzebujemy 'getMessaging', a nie 'getAnalytics'
import { getMessaging } from "firebase/messaging";

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

const app = initializeApp(firebaseConfig);

// Inicjalizujemy i eksportujemy 'messaging', a nie 'analytics'
export const messaging = getMessaging(app);