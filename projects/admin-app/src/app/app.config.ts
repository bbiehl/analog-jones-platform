import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FIRESTORE } from '../../../../libs/shared/firebase.token';
import { routes } from './app.routes';
import { firestore } from './firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: FIRESTORE, useValue: firestore },
  ],
};
