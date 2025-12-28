import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvN3a1FDgKf1FxwK0pive04VzTVgXzJzY",
  authDomain: "saad-fb888.firebaseapp.com",
  projectId: "saad-fb888",
  storageBucket: "saad-fb888.firebasestorage.app",
  messagingSenderId: "664726398056",
  appId: "1:664726398056:web:a3574d2376ddcb1e9847dd",
  measurementId: "G-EM62BDXYNK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);