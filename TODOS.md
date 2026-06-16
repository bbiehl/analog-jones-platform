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

## Completed
