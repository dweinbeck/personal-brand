import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";
import { clientEnv } from "@/lib/env";

function getFirebaseConfig() {
  const env = clientEnv();
  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _firestore: Firestore | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

export function getClientFirestore(): Firestore {
  if (!_firestore) {
    _firestore = getFirestore(getFirebaseApp());
  }
  return _firestore;
}
