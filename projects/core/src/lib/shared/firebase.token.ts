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
import {
  deleteObject,
  FirebaseStorage,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

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
export const STORAGE = new InjectionToken<FirebaseStorage>('Storage');

export interface StorageOps {
  ref: typeof ref;
  uploadBytes: typeof uploadBytes;
  getDownloadURL: typeof getDownloadURL;
  deleteObject: typeof deleteObject;
}

export const STORAGE_OPS = new InjectionToken<StorageOps>('StorageOps', {
  providedIn: 'root',
  factory: () => ({ ref, uploadBytes, getDownloadURL, deleteObject }),
});

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
