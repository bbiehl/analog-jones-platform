import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'firebase/firestore';
import { environment } from '../environments/environment';

const app = initializeApp(environment.firebaseConfig);

// In the browser, opt into auto-detected long-polling. The default streaming
// WebChannel transport pays a multi-step connection handshake on the first read
// (~600ms+ on fast wifi, multiple seconds on lossy/high-latency mobile) and can
// stall outright behind carrier proxies before timing out. Auto-detect probes
// both transports and fails fast to long-polling, killing the cold first-read
// stall that made in-app episode navigation feel frozen. The option is browser
// only, so the SSR (Node) server keeps the plain client.
export const firestore =
  typeof window !== 'undefined'
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
    : getFirestore(app);

if (environment.useEmulators) {
  connectFirestoreEmulator(firestore, 'localhost', 8080);
}
