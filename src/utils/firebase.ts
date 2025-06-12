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
let app;
let auth;
let db;

try {
  console.log('🔥 Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication
  auth = getAuth(app);
  
  // Configure auth settings for better reliability
  auth.settings.appVerificationDisabledForTesting = false;
  
  // Initialize Cloud Firestore
  db = getFirestore(app);
  
  console.log('✅ Firebase initialized successfully');
  console.log('🔐 Auth domain:', firebaseConfig.authDomain);
  console.log('📊 Project ID:', firebaseConfig.projectId);
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase. Please check your internet connection and try again.');
}

// Export the initialized services
export { auth, db };
export default app;