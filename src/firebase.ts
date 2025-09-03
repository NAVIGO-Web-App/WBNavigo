import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqQdK5XJ1L_APvIM8IbHhucafjBX3TLPU",
  authDomain: "navigo-6ef6c.firebaseapp.com",
  projectId: "navigo-6ef6c",
  storageBucket: "navigo-6ef6c.firebasestorage.app",
  messagingSenderId: "58284097478",
  appId: "1:58284097478:web:5ef3fa6708ca2e95f9bcc7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
