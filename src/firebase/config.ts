// Firebase configuration
// Replace with your actual Firebase config from Firebase Console
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// VAPID key for FCM web push
export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''

// Check if running in emulator mode
export const isEmulatorMode = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true'

// Validate Firebase config is provided (only for production, not emulator mode)
if (!firebaseConfig.apiKey && !isEmulatorMode) {
  throw new Error('Firebase config missing: VITE_FIREBASE_API_KEY is required. Check your .env file.')
}

// For emulator mode, provide minimal config so Firebase initializes
if (isEmulatorMode && !firebaseConfig.apiKey) {
  firebaseConfig.apiKey = 'emulator-api-key'
  firebaseConfig.authDomain = 'localhost'
  firebaseConfig.projectId = 'demo-project'
  firebaseConfig.storageBucket = 'demo-project.appspot.com'
  firebaseConfig.messagingSenderId = '123456789'
  firebaseConfig.appId = '1:123456789:web:emulator'
}