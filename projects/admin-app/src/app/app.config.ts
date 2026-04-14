import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FIRESTORE, STORAGE } from '../../../../libs/shared/firebase.token';
import { routes } from './app.routes';
import { firestore, storage } from './firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: FIRESTORE, useValue: firestore },
    { provide: STORAGE, useValue: storage },
  ],
};
