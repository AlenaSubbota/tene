import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

// Ваша конфигурация Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// Инициализируем приложение
const app = initializeApp(firebaseConfig);

// Экспортируем сервисы, которые будем использовать в других частях приложения
export const db = getFirestore(app);
export const auth = getAuth(app);

// Устанавливаем persistence (чтобы пользователь оставался в системе)
setPersistence(auth, browserLocalPersistence);