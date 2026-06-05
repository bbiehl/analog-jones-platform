import { APIRequestContext, request } from '@playwright/test';

/**
 * Firebase emulator endpoints. Ports match `firebase.json`.
 *
 * WEB_API_KEY must equal `firebaseConfig.apiKey` in the apps'
 * `src/environments/environment.ts`. The Auth emulator ignores the `?key=` query
 * param, but the SDK derives its IndexedDB session key from the app's apiKey
 * (`firebase:authUser:<apiKey>:[DEFAULT]`), so the auth fixture must seed under the
 * exact same value or the seeded session won't be found. If the env key rotates,
 * update this too.
 */
export const WEB_API_KEY = 'AIzaSyDTqvdZ9ti_Fht7Gkp_m9FxS8qaGYLwjDs';

export const AUTH_EMULATOR = 'http://localhost:9099';

/** Seeded admin account — see `seed-data/auth_export/accounts.json`. */
export const BRAD = {
  uid: 'AdgKfLB0sN0uNfLdXlp9ANnzLocZ',
  email: 'brad@test.com',
  displayName: 'Brad',
  /** google.com federated id from the seed export. */
  rawId: '2683405489086408341959332724337331614185',
};

export interface EmulatorSignInResult {
  idToken: string;
  refreshToken: string;
  localId: string;
  expiresIn: string;
}

/**
 * Sign a seeded user in through the Auth emulator's `signInWithIdp` endpoint,
 * impersonating a Google federated login. Returns the freshly minted tokens.
 */
export async function signInWithGoogleEmulator(
  ctx: APIRequestContext,
  user: { email: string; displayName: string; rawId: string },
): Promise<EmulatorSignInResult> {
  const postBody =
    `id_token=${encodeURIComponent(
      JSON.stringify({
        sub: user.rawId,
        email: user.email,
        email_verified: true,
        name: user.displayName,
      }),
    )}&providerId=google.com`;

  const res = await ctx.post(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${WEB_API_KEY}`,
    {
      data: {
        postBody,
        requestUri: 'http://localhost',
        returnIdpCredential: true,
        returnSecureToken: true,
      },
    },
  );

  if (!res.ok()) {
    throw new Error(
      `Auth emulator signInWithIdp failed (${res.status()}): ${await res.text()}`,
    );
  }

  return (await res.json()) as EmulatorSignInResult;
}

/** Convenience: open a throwaway request context and sign Brad in. */
export async function signInAsBrad(): Promise<EmulatorSignInResult> {
  const ctx = await request.newContext();
  try {
    return await signInWithGoogleEmulator(ctx, BRAD);
  } finally {
    await ctx.dispose();
  }
}
