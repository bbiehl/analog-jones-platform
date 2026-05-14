import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { environment } from '../environments/environment';

const app = initializeApp(environment.firebaseConfig);

export const firestore = getFirestore(app);
export const storage = getStorage(app);

if (environment.useEmulators) {
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
