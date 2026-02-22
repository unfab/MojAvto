// Firebase Configuration - MojAvto.si
// Project: mojavto-64b50

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyB6QLlangCD1UQgX2ADWvmlgWAejzf2XJs",
    authDomain: "mojavto-64b50.firebaseapp.com",
    projectId: "mojavto-64b50",
    storageBucket: "mojavto-64b50.firebasestorage.app",
    messagingSenderId: "929578654107",
    appId: "1:929578654107:web:2c477c4508f62c0717a93e",
    measurementId: "G-ZHQVLN0C66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

