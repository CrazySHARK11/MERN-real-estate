import { initializeApp } from "firebase/app";
 
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-estate-45ae2.firebaseapp.com",
  projectId: "mern-estate-45ae2",
  storageBucket: "mern-estate-45ae2.appspot.com",
  messagingSenderId: "113065221341",
  appId: "1:113065221341:web:301699c490bb2ef85f4f34",
};

export const app = initializeApp(firebaseConfig);
