import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { environment } from '../environments/environment';

const app = initializeApp(environment.firebaseConfig);

export const firestore = getFirestore(app);

if (environment.useEmulators) {
  connectFirestoreEmulator(firestore, 'localhost', 8080);
}
