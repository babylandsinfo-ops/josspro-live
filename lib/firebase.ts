// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsG0yTsB5UvThU54fVGIoXXkRkUkPUssk",
  authDomain: "osspro-crm.firebaseapp.com",
  projectId: "osspro-crm",
  storageBucket: "osspro-crm.firebasestorage.app",
  messagingSenderId: "319466418224",
  appId: "1:319466418224:web:b6908337ec5e7c7fbf3df5",
  measurementId: "G-6VJWFEXME5",
};

// অ্যাপ ইনিশিলাইজ (সার্ভার সাইড এরর এড়ানোর জন্য)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };