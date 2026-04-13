import { InjectionToken } from '@angular/core';
import { Firestore } from 'firebase/firestore';

export const FIRESTORE = new InjectionToken<Firestore>('Firestore');
