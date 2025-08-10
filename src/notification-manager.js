// Plik: src/notification-manager.js

import { getToken } from "firebase/messaging";
import { messaging } from "./firebase-config";

export const requestNotificationPermission = async () => {
  try {
    const vapidKey = "BFr6_F0fqESHkNxesjiEJiiDt5nIkhRKkIiwsfSFuz9_wI58nhqmEhM8_8stPu-lqpW3oCr547gVaWnnnBMCoBg"; 

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Zgoda na powiadomienia została udzielona.");

      // --- DODANA KLUCZOWA ZMIANA ---
      // Czekamy, aż Service Worker będzie w pełni aktywny i gotowy.
      console.log("Oczekiwanie na aktywację Service Workera...");
      await navigator.serviceWorker.ready;
      console.log("Service Worker jest aktywny!");
      // -----------------------------
      
      const currentToken = await getToken(messaging, { vapidKey: vapidKey });
      if (currentToken) {
        console.log("UDAŁO SIĘ! Oto Twój token:");
        console.log(currentToken);
        alert("Sukces! Token do powiadomień został pobrany. Skopiuj go z konsoli (F12).");
      } else {
        console.log("Nie udało się uzyskać tokenu po aktywacji Service Workera.");
      }
    } else {
      console.log("Użytkownik nie wyraził zgody na powiadomienia.");
    }
  } catch (error) {
    console.error("Wystąpił błąd podczas pobierania tokenu:", error);
  }
};