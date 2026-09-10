// Firebase configuration
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork, initializeFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence, getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyARpGWdML6bL11AEJoVMQLirhnInGJUbV0",
  authDomain: "arguemind-35575.firebaseapp.com",
  projectId: "arguemind-35575",
  storageBucket: "arguemind-35575.firebasestorage.app",
  messagingSenderId: "1011754069445",
  appId: "1:1011754069445:web:91325cdfbd8c302412efac"
};

// --- SINGLETON INITIALIZATION ---
// This pattern ensures that Firebase services are initialized only once.

const getFirebaseApp = () => {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
};

const app = getFirebaseApp();

// Enhanced Firestore settings for Samsung and Android devices
// This helps prevent "INTERNAL ASSERTION FAILED: Unexpected state" errors
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Use long-polling for better Android compatibility
  useFetchStreams: false, // Disable fetch streams (problematic on some Android devices)
  ignoreUndefinedProperties: true,
  cacheSizeBytes: 41943040, // 40MB
  experimentalAutoDetectLongPolling: false, // Disable auto-detection, force long polling
});

let auth;
try {
  if (Platform.OS === 'web') {
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  }
} catch (e) {
  auth = getAuth(app);
}

// Initialize Realtime Database for Round 2 buzzer system (reduces Firestore writes by 45!)
const realtimeDb = getDatabase(app);

export { db, auth, realtimeDb };

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
