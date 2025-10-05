// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2Z15oGAdmnLBFR1DmY68qEirTQMJNgYo",
  authDomain: "fahim-poultry-feed-53dd8.firebaseapp.com",
  projectId: "fahim-poultry-feed-53dd8",
  storageBucket: "fahim-poultry-feed-53dd8.firebasestorage.app",
  messagingSenderId: "1056487205737",
  appId: "1:1056487205737:web:5fdfea163ae138a9a52bf8",
  measurementId: "G-4EQBQVPYKT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);