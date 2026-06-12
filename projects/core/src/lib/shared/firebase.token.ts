import { InjectionToken } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  documentId,
  Firestore,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
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
export const FIRESTORE = new InjectionToken<Firestore>('Firestore');

export interface FirestoreOps {
  collection: typeof collection;
  doc: typeof doc;
  documentId: typeof documentId;
  query: typeof query;
  orderBy: typeof orderBy;
  where: typeof where;
  limit: typeof limit;
  getDoc: typeof getDoc;
  getDocs: typeof getDocs;
  getCountFromServer: typeof getCountFromServer;
  addDoc: typeof addDoc;
  updateDoc: typeof updateDoc;
  writeBatch: typeof writeBatch;
}

export const FIRESTORE_OPS = new InjectionToken<FirestoreOps>('FirestoreOps', {
  providedIn: 'root',
  factory: () => ({
    collection,
    doc,
    documentId,
    query,
    orderBy,
    where,
    limit,
    getDoc,
    getDocs,
    getCountFromServer,
    addDoc,
    updateDoc,
    writeBatch,
  }),
});
