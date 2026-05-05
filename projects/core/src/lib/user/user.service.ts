import { inject, Injectable } from '@angular/core';
import { User } from 'firebase/auth';
import { AUTH, AUTH_OPS, FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';
import { AppUser } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private auth = inject(AUTH);
  private authOps = inject(AUTH_OPS);
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async signInWithGoogle(): Promise<User> {
    const provider = new this.authOps.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await this.authOps.signInWithPopup(this.auth, provider);
    return result.user;
  }

  async signOutUser(): Promise<void> {
    await this.authOps.signOut(this.auth);
  }

  async getUserDoc(uid: string): Promise<AppUser | null> {
    const snap = await this.ops.getDoc(this.ops.doc(this.firestore, 'users', uid));
    if (!snap.exists()) {
      return null;
    }
    return { id: snap.id, ...snap.data() } as AppUser;
  }

  listenToAuthState(callback: (user: User | null) => void): () => void {
    return this.authOps.onAuthStateChanged(this.auth, callback);
  }

  async getAllUsers(): Promise<AppUser[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'users'),
      this.ops.orderBy('name')
    );
    const snapshot = await this.ops.getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AppUser);
  }
}
