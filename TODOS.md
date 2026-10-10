# TODOS

## core / taxonomy denormalization

Deferred from the `remove-junctions-embed-taxonomy` ship (adversarial review, Codex + Claude). These are low-probability on a single-admin site but are real correctness/operational gaps in the embedded-taxonomy model.

- **Concurrent taxonomy edits can lose updates**
  **Priority:** P2
  `category/genre/tag.service.ts` rewrite the whole embedded array from a snapshot read (`rewriteAcrossEpisodes` / `setEpisodesForCategory`). Two concurrent same-type edits = last-write-wins, silently dropping the other edit. Cross-type edits are safe (Firestore field-level merge). Fix: use a Firestore transaction or per-item array merge (`arrayUnion`/`arrayRemove`) so concurrent edits don't clobber. Only matters once there's more than one admin editing at once.

- **Non-atomic cross-episode propagation can leave inconsistent denormalized copies**
  **Priority:** P2
  `updateCategory`/`deleteCategory` (and genre/tag equivalents) propagate name/slug changes across episodes in multiple non-transactional 500-op batches (`commitInChunks`). A mid-flight failure (quota, permission, network) leaves the master doc and episode embeds inconsistent with no retry marker or repair path. Fix: add a reconciliation/repair routine, or a "needs repropagation" marker the admin can re-run. Recoverable today by re-saving the taxonomy item.

- **Embedded-taxonomy code depends on a completed data backfill before deploy**
  **Priority:** P1
  `episode.service.ts` `toEpisode` defaults missing `categories`/`genres`/`tags` to `[]` and the junction-service fallback is gone. If this deploys before production episodes are backfilled with embedded taxonomy (the `seed-episode-backfill` work), public detail/search/related pages silently lose relations and admin bulk-edit initializes from empty state. Action: gate the production deploy on the backfill landing first.

## public-app / SSR caching

Surfaced by adversarial review (Codex) during the `fix/explorer-server-render` ship. These apply app-wide to every `RenderMode.Server` route (`/`, `/episodes`, `/episodes/:id`, and now `/explorer`) — they are not specific to the explorer fix, which only brought `/explorer` onto the same proven pattern.

- **Transient Firestore failure gets cached as a 200**
  **Priority:** P2
  Domain stores (`explore-search.store.ts:58`, `episode.store.ts` catch blocks) swallow a Firestore error into UI `error` state and let the SSR render return 200. The Express cache gate (`projects/public-app/src/server.ts:188`) only checks `response.status === 200`, so an outage/quota blip can cache an empty/error page (`s-maxage=300`, `stale-while-revalidate=86400`). Fix: on the server render path, surface the failure as a non-200 (rethrow / status) or gate the long Cache-Control header on successful data so error renders aren't edge-cached.

- **Query-string variants force CDN cache misses + Firestore read amplification**
  **Priority:** P3
  The cache-header regex matches on `req.path` (query excluded), but Firebase Hosting's CDN keys on the full URL, so `/<route>?x=<random>` is a distinct cache key. Each miss runs a full SSR render plus the route's Firestore reads (3 collection reads for `/explorer` via `getAutoCompleteOptions()`). Fix: canonicalize/ignore query strings for cacheable HTML routes at the edge, or strip unknown query params before render.

## release tooling

Surfaced by the pre-landing reviews (red team, Claude adversarial, Codex) during the Angular 22 ship on `chore/angular-22`. All are in `scripts/deploy.mjs` / `scripts/rollback.mjs`; none blocks a normal release.

- **Failed releases leave their temporary worktree behind**
  **Priority:** P2
  `fail()` calls `process.exit(1)` inside the `try` in `scripts/deploy.mjs` step 6, and `process.exit` skips `finally`, so a failed deploy or traffic step leaves an `aj-release-*` directory and a stale `git worktree` entry. The exit code of `git worktree add` is also ignored, so a failed add goes on to `gcloud run deploy --source <empty dir>`. Fix: throw inside the loop and call `fail()` after the `try/finally` (or clean up in a `process.on('exit')` hook), and check the `worktree add` exit code.

- **Release publishes Hosting config and rules from the local checkout**
  **Priority:** P2
  Cloud Run is built from a clean worktree of `origin/main`, but `firebase deploy --only hosting` and `pnpm deploy:rules` run in the current folder, so they publish whatever `firebase.json`, `firebase-public/`, `firestore.rules` and `firestore.indexes.json` are there, committed or not, while rules-change detection looks at `origin/main`. `scripts/rollback.mjs` guards its own Hosting step against uncommitted, untracked and ignored files but not against a branch whose committed `firebase.json` differs from the release. Fix: run the Hosting and rules deploys from the release worktree, or abort in pre-flight when those paths differ from `origin/main`.

- **Release promotes "latest", not the revision it built**
  **Priority:** P3
  `scripts/deploy.mjs` runs `gcloud run services update-traffic <service> --to-latest` after each deploy. If two releases, or a release and a rollback, overlap, it can promote a revision this release did not build or overwrite a fresh pin. It also resets any manual traffic split without saying so. Fix: read the revision name the deploy created and promote that one, and print each service's serving state (pinned or not) in the release plan.

- **Rollback never checks that the CDN was actually cleared**
  **Priority:** P3
  `scripts/rollback.mjs` assumes a Hosting redeploy with unchanged content still clears cached Cloud Run HTML (`s-maxage=300`, `stale-while-revalidate=86400` in `projects/public-app/src/server.ts`). Firebase docs say a redeploy clears "all your cached content" but do not say so for rewrites. Fix: after the redeploy, fetch `/` through the CDN and confirm the script chunks it references return 200. The same window exists in every forward release between the Cloud Run step and the Hosting step.

- **Node version floor is not pinned**
  **Priority:** P4
  Angular 22.2 needs Node `^22.22.3 || ^24.15.0 || >=26`. `Dockerfile` (`node:22-slim`) and CI (`node-version: 22`) float and resolve high enough today. A stale cached base image would fail inside Cloud Build after the release branch and tag are pushed. Fix: pin the floor in the Dockerfile and CI and add `engines` to `package.json`.

## Completed
