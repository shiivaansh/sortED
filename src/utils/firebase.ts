import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAcIrPFrbI7qjbntE_wTed5JQjZZELSlRU",
  authDomain: "sorted-80b0b.firebaseapp.com",
  projectId: "sorted-80b0b",
  storageBucket: "sorted-80b0b.firebasestorage.app",
  messagingSenderId: "146176482882",
  appId: "1:146176482882:web:6e06d96027b587b61f97db",
  measurementId: "G-H4TLBCY6YC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Enable network persistence for Firestore
try {
  // This helps with offline functionality
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export default app;