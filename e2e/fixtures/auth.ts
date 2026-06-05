import { test as base, expect } from '@playwright/test';
import { BRAD, WEB_API_KEY, signInAsBrad } from './emulator';

/**
 * Admin-app auth fixture.
 *
 * The Google sign-in popup can't be driven in e2e, and the Firebase Web SDK
 * persists its session in IndexedDB (`firebaseLocalStorageDb`) — which Playwright's
 * `storageState` does NOT capture. So instead of replaying a popup we:
 *   1. mint real emulator tokens for the seeded admin (Brad) via the Auth emulator REST API, and
 *   2. seed the SDK's IndexedDB record with `addInitScript` before the app boots,
 *      so `onAuthStateChanged` fires with an authenticated admin on first load.
 *
 * Use `adminTest` in any admin spec that must be logged in. For specs that
 * exercise the unauthenticated path (e.g. the auth guard), use the bare `test`
 * from `@playwright/test` instead.
 */
export const adminTest = base.extend({
  // Override `page` so every page in an admin spec boots already signed in.
  page: async ({ page }, use) => {
    const { idToken, refreshToken } = await signInAsBrad();

    const now = Date.now();
    const storedUser = {
      uid: BRAD.uid,
      email: BRAD.email,
      emailVerified: true,
      displayName: BRAD.displayName,
      isAnonymous: false,
      photoURL: null,
      providerData: [
        {
          providerId: 'google.com',
          uid: BRAD.rawId,
          displayName: BRAD.displayName,
          email: BRAD.email,
          phoneNumber: null,
          photoURL: null,
        },
      ],
      stsTokenManager: {
        refreshToken,
        accessToken: idToken,
        expirationTime: now + 60 * 60 * 1000,
      },
      createdAt: String(now),
      lastLoginAt: String(now),
      apiKey: WEB_API_KEY,
      appName: '[DEFAULT]',
    };

    // Runs at document start on every navigation, before the app bundle loads,
    // so the seeded session is in place by the time Firebase Auth initializes.
    await page.addInitScript(
      ([key, value]) => {
        const fbaseKey = key as string;
        const record = { fbase_key: fbaseKey, value: value as unknown };
        const openReq = indexedDB.open('firebaseLocalStorageDb', 1);
        openReq.onupgradeneeded = () => {
          const db = openReq.result;
          if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
            db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
          }
        };
        openReq.onsuccess = () => {
          const db = openReq.result;
          const tx = db.transaction('firebaseLocalStorage', 'readwrite');
          tx.objectStore('firebaseLocalStorage').put(record);
        };
      },
      [`firebase:authUser:${WEB_API_KEY}:[DEFAULT]`, storedUser] as const,
    );

    await use(page);
  },
});

export { expect };
