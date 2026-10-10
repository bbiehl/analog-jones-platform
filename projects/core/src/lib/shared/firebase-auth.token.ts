import { InjectionToken } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

// Kept apart from firebase.token.ts: importing `firebase/auth` has side effects,
// so any file that imports it drags the whole auth SDK into every app that
// touches that file. public-app has no auth and only needs the Firestore tokens.
export const AUTH = new InjectionToken<Auth>('Auth');

export interface AuthOps {
  GoogleAuthProvider: typeof GoogleAuthProvider;
  signInWithPopup: typeof signInWithPopup;
  signOut: typeof signOut;
  onAuthStateChanged: typeof onAuthStateChanged;
}

export const AUTH_OPS = new InjectionToken<AuthOps>('AuthOps', {
  providedIn: 'root',
  factory: () => ({ GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }),
});
