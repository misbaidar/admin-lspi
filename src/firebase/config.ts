// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Ganti Storage dengan Auth

// 👇 PASTE KONFIGURASI DARI FIREBASE CONSOLE DI SINI
const firebaseConfig = {
  apiKey: "AIzaSyBvvk-5g7KJx53I7xk9PJoM2dg_oGbqxio",
  authDomain: "lspi-system.firebaseapp.com",
  projectId: "lspi-system",
  storageBucket: "lspi-system.firebasestorage.app",
  messagingSenderId: "421390270894",
  appId: "1:421390270894:web:2c3449d20971a15795c83f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export layanan Database & Auth saja (Storage dihapus)
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;