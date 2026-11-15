import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Lazy singletons — only initialise in the browser (avoids prerender failures).
let _app: FirebaseApp | undefined
let _auth: Auth | undefined
let _db: Firestore | undefined

function getApp(): FirebaseApp {
  if (!_app) _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return _app
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getApp())
  return _auth
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getApp())
  return _db
}

export const googleProvider = new GoogleAuthProvider()

/** Base URL encoded into QR codes; scanning opens `${PUBLIC_BASE_URL}/c/<qrId>`. */
export const PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_PUBLIC_BASE_URL || 'https://tagverify-5f8b1.web.app'

/** Shown to people who can't access the panel. */
export const ADMIN_NAME = 'Vikas Agarwal'
