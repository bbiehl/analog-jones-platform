import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FIRESTORE, STORAGE } from '../../../../libs/shared/firebase.token';
import { routes } from './app.routes';
import { firestore, storage } from './firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    { provide: FIRESTORE, useValue: firestore },
    { provide: STORAGE, useValue: storage },
  ],
};
