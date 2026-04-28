import { InjectionToken } from '@angular/core';

export const CANONICAL_ORIGIN = 'https://analogjonestof.com';

export const SITE_NAME = 'Analog Jones and the Temple of Film';

export const ORIGIN = new InjectionToken<string>('ORIGIN', {
  providedIn: 'root',
  factory: () => CANONICAL_ORIGIN,
});
