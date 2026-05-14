import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
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

// Defer App Check off the critical path. The home route hydrates from
// TransferState, so it does not need a token to render. Initializing inline
// blocks first paint on iOS Safari, where reCAPTCHA Enterprise's token
// exchange can stall for tens of seconds under ITP.
if (typeof window !== 'undefined' && !environment.useEmulators && environment.recaptchaSiteKey) {
  const init = () => {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(environment.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  };
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => void };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(init);
  } else {
    setTimeout(init, 0);
  }
}
