import { InjectionToken } from '@angular/core';
import { Auth } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  Firestore,
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
  query: typeof query;
  orderBy: typeof orderBy;
  where: typeof where;
  limit: typeof limit;
  getDoc: typeof getDoc;
  getDocs: typeof getDocs;
  addDoc: typeof addDoc;
  updateDoc: typeof updateDoc;
  writeBatch: typeof writeBatch;
}

export const FIRESTORE_OPS = new InjectionToken<FirestoreOps>('FirestoreOps', {
  providedIn: 'root',
  factory: () => ({
    collection,
    doc,
    query,
    orderBy,
    where,
    limit,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    writeBatch,
  }),
});
