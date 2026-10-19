import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from "firebase/functions";
import {
  getMessaging,
  isSupported,
  getToken,
  onMessage,
  type Messaging,
} from "firebase/messaging";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { firebaseConfig, vapidKey } from "./config";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;
let messaging: Messaging | null = null;

// Initialize Firebase
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// App Check disabled for now (reCAPTCHA v3 key not validated for this domain).
// To enable: set VITE_ENABLE_APP_CHECK=true and ensure a valid reCAPTCHA v3 site key is in VITE_RECAPTCHA_V3_SITE_KEY.
const enableAppCheck = import.meta.env.VITE_ENABLE_APP_CHECK === 'true';
const recaptchaKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
if (enableAppCheck && typeof window !== "undefined" && !import.meta.env.DEV && recaptchaKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('App Check initialization failed:', error);
  }
}

auth = getAuth(app);
db = getFirestore(app);
functions = getFunctions(app);

// Initialize messaging only in browser and if supported
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

// Connect to emulators only when explicitly enabled AND on localhost
const useEmulators =
  import.meta.env.VITE_USE_EMULATOR === "true" &&
  window.location.hostname === "localhost";

if (useEmulators) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
}

// FCM token management
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) return null;
  try {
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.warn("Failed to get FCM token:", error);
    return null;
  }
}

export function onForegroundMessage(
  callback: (payload: any) => void,
): (() => void) | null {
  if (!messaging) return null;
  return onMessage(messaging, callback);
}

export { app, auth, db, functions, messaging };
