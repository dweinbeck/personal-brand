import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !authDomain || !projectId) {
    throw new Error(
      `Firebase config missing required environment variables. ` +
        `Ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, ` +
        `and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set in .env.local`,
    );
  }

  return { apiKey, authDomain, projectId };
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;

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
