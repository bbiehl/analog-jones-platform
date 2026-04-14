import { inject, Injectable } from '@angular/core';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { AUTH, FIRESTORE } from '../shared/firebase.token';
import { AppUser } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private auth = inject(AUTH);
  private firestore = inject(FIRESTORE);

  async signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
    return result.user;
  }

  async signOutUser(): Promise<void> {
    await signOut(this.auth);
  }

  async getUserDoc(uid: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(this.firestore, 'users', uid));
    if (!snap.exists()) {
      return null;
    }
    return { id: snap.id, ...snap.data() } as AppUser;
  }

  listenToAuthState(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  async getAllUsers(): Promise<AppUser[]> {
    const q = query(collection(this.firestore, 'users'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AppUser);
  }
}
