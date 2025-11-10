// Firebase configuration
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork, initializeFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD2PSmfHGdlKoKol9KxRLdogXD8HNN2rvA",
  authDomain: "arguemind.firebaseapp.com",
  projectId: "arguemind",
  storageBucket: "arguemind.firebasestorage.app",
  messagingSenderId: "472540987727",
  appId: "1:472540987727:web:5482ab663cd1c66f59c53a"
};

// Initialize Firebase (prevent multiple initializations)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore with settings optimized for 60+ concurrent users
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Helps with React Native and multiple connections
    useFetchStreams: false, // Prevents internal errors
    ignoreUndefinedProperties: true, // Ignore undefined values
    cacheSizeBytes: 41943040, // 40MB cache (default is 40MB, helps with multiple users)
  });
} catch (error) {
  // If already initialized, just get the instance
  console.log('⚠️ Firestore already initialized, using existing instance');
  db = getFirestore(app);
}

// Initialize Auth (prevent multiple initializations)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  // If already initialized, just get the instance
  auth = getAuth(app);
}

// Export initialized services
export { db, auth };

// Initialize offline support with retry logic
export const initializeOfflineSupport = async () => {
  try {
    // Enable network first
    await enableNetwork(db);
    console.log('✅ Firebase connected successfully');
    return { success: true };
  } catch (error) {
    console.log('⚠️ Firebase connection issue:', error.message);
    // Retry once after a brief delay
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await enableNetwork(db);
      console.log('✅ Firebase connected on retry');
      return { success: true };
    } catch (retryError) {
      console.log('⚠️ Firebase running in offline mode');
      return { success: false, offline: true };
    }
  }
};

export default app;
