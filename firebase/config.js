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

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

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
