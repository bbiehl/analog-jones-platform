import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { AUTH, FIRESTORE, STORAGE } from '@aj/core';
import { UserStore } from '@aj/core';
import { routes } from './app.routes';
import { auth, firestore, storage } from './firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: AUTH, useValue: auth },
    { provide: FIRESTORE, useValue: firestore },
    { provide: STORAGE, useValue: storage },
    provideAppInitializer(() => inject(UserStore).init()),
  ],
};
