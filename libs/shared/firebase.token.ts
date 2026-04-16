import { InjectionToken } from '@angular/core';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
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
