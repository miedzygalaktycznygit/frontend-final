// Plik: src/notification-manager.js

import { getToken } from "firebase/messaging";
import { messaging } from "./firebase-config";

export const requestNotificationPermission = async () => {
  try {
    const vapidKey = "BFr6_F0fqESHkNxesjiEJiiDt5nIkhRKkIiwsfSFuz9_wI58nhqmEhM8_8stPu-lqpW3oCr547gVaWnnnBMCoBg"; 

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Zgoda na powiadomienia udzielona. Pobieranie tokenu...");
      const currentToken = await getToken(messaging, { vapidKey: vapidKey });
      
      if (currentToken) {
        console.log("✅ Token FCM uzyskany:", currentToken);
        // KLUCZOWA ZMIANA: Zwracamy token, aby AppContext mógł go użyć
        return currentToken;
      } else {
        console.log("❌ Nie udało się uzyskać tokenu.");
        return null;
      }
    } else {
      console.log("Użytkownik nie wyraził zgody na powiadomienia.");
      return null;
    }
  } catch (error) {
    console.error("❌ Błąd podczas pobierania tokenu:", error);
    return null;
  }
};