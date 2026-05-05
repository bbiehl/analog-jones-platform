import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStore } from '@aj/core';

export const authGuard: CanActivateFn = async () => {
  const userStore = inject(UserStore);
  const router = inject(Router);

  while (!userStore.authReady()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const user = userStore.user();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (!userStore.isAdmin()) {
    return router.createUrlTree(['/access-denied']);
  }

  return true;
};
