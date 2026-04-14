import { InjectionToken } from '@angular/core';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

export const AUTH = new InjectionToken<Auth>('Auth');
export const FIRESTORE = new InjectionToken<Firestore>('Firestore');
export const STORAGE = new InjectionToken<FirebaseStorage>('Storage');
