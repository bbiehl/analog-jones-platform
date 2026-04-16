import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { AppUser, UserRole } from './user.model';
import { UserService } from './user.service';

interface UserState {
  user: AppUser | null;
  authReady: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  authReady: false,
  loading: false,
  error: null,
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isAdmin: computed(() => store.user()?.role === UserRole.ADMIN),
  })),
  withMethods((store) => {
    const userService = inject(UserService);

    return {
      init() {
        userService.listenToAuthState(async (firebaseUser) => {
          try {
            if (firebaseUser) {
              const appUser = await userService.getUserDoc(firebaseUser.uid);
              patchState(store, { user: appUser, authReady: true, loading: false });
            } else {
              patchState(store, { user: null, authReady: true, loading: false });
            }
          } catch (e) {
            patchState(store, {
              user: null,
              authReady: true,
              loading: false,
              error: (e as Error).message,
            });
          }
        });
      },

      async signIn() {
        patchState(store, { loading: true, error: null, authReady: false });
        try {
          await userService.signInWithGoogle();
          // Don't set loading false here — the auth listener will
          // fetch the user doc and set authReady, then we're done
        } catch (e) {
          patchState(store, { loading: false, authReady: true, error: (e as Error).message });
        }
      },

      async signOut() {
        await userService.signOutUser();
        patchState(store, { user: null });
      },
    };
  })
);
