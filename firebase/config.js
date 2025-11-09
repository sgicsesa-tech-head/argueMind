// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCIOfKFOXLE1V5-BPySmeGM00HZ4e2wBmw",
  authDomain: "top-sunrise-456807-h3.firebaseapp.com",
  projectId: "top-sunrise-456807-h3",
  storageBucket: "top-sunrise-456807-h3.firebasestorage.app",
  messagingSenderId: "748013355435",
  appId: "1:748013355435:web:d506a16b0f1f3a121412ee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);

// Enable offline persistence for better reliability
import { enableNetwork, disableNetwork } from 'firebase/firestore';

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize offline support
export const initializeOfflineSupport = async () => {
  try {
    // Enable network first
    await enableNetwork(db);
    console.log('Firebase connected successfully');
    return { success: true };
  } catch (error) {
    console.log('Firebase running in offline mode:', error.message);
    return { success: false, offline: true };
  }
};

export default app;
