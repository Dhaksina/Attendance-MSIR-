import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

// User-provided configuration for project "attendancemsir"
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyB6WSgvOpIsYvEKYbw70GIP1wFnZyZllz0",
  authDomain: "attendancemsir.firebaseapp.com",
  projectId: "attendancemsir",
  storageBucket: "attendancemsir.firebasestorage.app",
  messagingSenderId: "491558078957",
  appId: "1:491558078957:web:34ca3dba6b69499a30ffe4",
  measurementId: "G-VVHVT6QS4R",
};

const getStoredFirebaseConfig = (): FirebaseConfig => {
  try {
    const stored = localStorage.getItem('msir_firebase_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId;

  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
  };
};

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let analyticsInstance: Analytics | null = null;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (firebaseAppInstance) return firebaseAppInstance;

  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseAppInstance = existingApps[0];
    } else {
      firebaseAppInstance = initializeApp(config);
    }

    // Initialize Analytics if supported in the browser
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && firebaseAppInstance && !analyticsInstance) {
          analyticsInstance = getAnalytics(firebaseAppInstance);
        }
      }).catch(() => {
        // Analytics not supported in this environment
      });
    }

    return firebaseAppInstance;
  } catch (err) {
    console.error('Failed to initialize Firebase App:', err);
    return null;
  }
};

export const getFirestoreDb = (): Firestore | null => {
  if (firestoreInstance) return firestoreInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (err) {
    console.error('Failed to initialize Firestore:', err);
    return null;
  }
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem('msir_firebase_config', JSON.stringify(config));
  firebaseAppInstance = null;
  firestoreInstance = null;
  analyticsInstance = null;
};

export const isFirebaseConfigured = (): boolean => {
  return getFirebaseApp() !== null;
};
