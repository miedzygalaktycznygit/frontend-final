import { getToken } from "firebase/messaging";
import { messaging } from "./firebase-config"; // Upewnij się, że ten plik istnieje i eksportuje 'messaging'

export const requestNotificationPermission = async () => {
  try {
    const vapidKey = "BFr6_F0fqESHkNxesjiEJiiDt5nIkhRKkIiwsfSFuz9_wI58nhqmEhM8_8stPu-lqpW3oCr547gVaWnnnBMCoBg"; 

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Zgoda na powiadomienia została udzielona. Próba pobrania tokenu...");
      
      // Pozwalamy Firebase samemu zarządzać rejestracją i aktywacją Service Workera
      const currentToken = await getToken(messaging, { vapidKey: vapidKey });
      
      if (currentToken) {
        console.log("✅ SUKCES! Oto Twój token:");
        console.log(currentToken);
        alert("Sukces! Token do powiadomień został pobrany. Skopiuj go z konsoli (F12).");
      } else {
        console.log("❌ Nie udało się uzyskać tokenu. Sprawdź, czy Service Worker jest poprawny.");
      }
    } else {
      console.log("Użytkownik nie wyraził zgody na powiadomienia.");
    }
  } catch (error) {
    console.error("❌ Wystąpił błąd podczas pobierania tokenu:", error);
  }
};