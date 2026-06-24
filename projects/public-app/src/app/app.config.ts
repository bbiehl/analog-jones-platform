import {
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser';
import { EpisodeService, FIRESTORE } from '@aj/core';
import { SeoTitleStrategy } from './seo/seo-title.strategy';
import { routes } from './app.routes';
import { firestore } from './firebase';

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
    // Incremental hydration: cards/scrollers wrapped in `@defer (hydrate on …)`
    // stay server-rendered (SEO + no CLS) but defer their hydration cost until
    // they're needed, cutting the up-front JS work on mobile cold loads.
    // withIncrementalHydration subsumes withEventReplay.
    provideClientHydration(withIncrementalHydration()),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    { provide: FIRESTORE, useValue: firestore },
    // Browser only: open the Firestore WebChannel during hydration so the
    // user's first in-app episode tap reuses a warm channel (~50ms) instead of
    // waiting on a fresh ~600ms+ handshake (multiple seconds on lossy mobile).
    // Must be a guaranteed network read — list/detail routes hydrate their data
    // from transfer-state and never open a channel on their own. Fire and
    // forget; bootstrap must not block on the network read.
    provideAppInitializer(() => {
      if (isPlatformBrowser(inject(PLATFORM_ID))) {
        inject(EpisodeService).warmConnection();
      }
    }),
  ],
};
