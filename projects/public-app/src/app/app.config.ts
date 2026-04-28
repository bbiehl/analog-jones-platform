import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FIRESTORE, STORAGE } from '../../../../libs/shared/firebase.token';
import { SeoTitleStrategy } from '../../../../libs/shared/seo/seo-title.strategy';
import { routes } from './app.routes';
import { firestore, storage } from './firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
    provideClientHydration(withEventReplay()),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    { provide: FIRESTORE, useValue: firestore },
    { provide: STORAGE, useValue: storage },
  ],
};
