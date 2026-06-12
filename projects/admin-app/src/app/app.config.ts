import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { AUTH, FIRESTORE } from '@aj/core';
import { UserStore } from '@aj/core';
import { routes } from './app.routes';
import { auth, firestore } from './firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: AUTH, useValue: auth },
    { provide: FIRESTORE, useValue: firestore },
    provideAppInitializer(() => inject(UserStore).init()),
  ],
};
