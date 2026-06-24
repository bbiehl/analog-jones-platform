import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'firebase/firestore';
import { environment } from '../environments/environment';

const app = initializeApp(environment.firebaseConfig);

if (typeof window !== 'undefined' && !environment.useEmulators && environment.recaptchaSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(environment.recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
// Browser: auto-detect long-polling so Firestore fails fast instead of stalling
// on the default WebChannel handshake (lossy networks / proxies). SSR keeps the
// plain client. See public-app/firebase.ts for the full rationale.
export const firestore =
  typeof window !== 'undefined'
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
    : getFirestore(app);

if (environment.useEmulators) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(firestore, 'localhost', 8080);
}
