#!/usr/bin/env node
// Black-box probe: verify unauthorized create/update/delete attempts against prod
// Firestore + Storage are blocked end-to-end. Sends token-less write requests against
// sentinel paths and expects 401/403 on every probe. The denial source is opaque
// (security rules vs. App Check enforcement) and that's intentional — what matters
// is the combined defense holds.
//
// PASS = every write attempt was rejected.
// FAIL = a write attempt returned 2xx; investigate Firestore/Storage rules and
//        App Check enforcement immediately. Sentinel paths bound the blast radius
//        if a write does slip through.
//
// Limitation: does not exercise authenticated abuse vectors (e.g., a self-created
// MEMBER user attempting writes to admin-only paths). That requires a token from a
// low-privilege account and belongs to a separate harness post-Auth-Day.

const PROJECT = 'analog-jones-v2';
const BUCKET = 'analog-jones-v2.firebasestorage.app';
const SENTINEL_DOC = '_probe_canary';
const SENTINEL_OBJECT = `_probe/canary-${Date.now()}.txt`;

const firestoreBase = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const storageBase = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`;

const sentinelBody = JSON.stringify({
  fields: { _probe: { stringValue: 'unauthorized-write-probe' } },
});

const writeProbes = [];

for (const collection of ['episodes', 'tags', 'genres']) {
  writeProbes.push({
    name: `Firestore CREATE ${collection}`,
    method: 'POST',
    url: `${firestoreBase}/${collection}`,
    headers: { 'Content-Type': 'application/json' },
    body: sentinelBody,
  });
  writeProbes.push({
    name: `Firestore UPDATE ${collection}/${SENTINEL_DOC}`,
    method: 'PATCH',
    url: `${firestoreBase}/${collection}/${SENTINEL_DOC}?updateMask.fieldPaths=_probe`,
    headers: { 'Content-Type': 'application/json' },
    body: sentinelBody,
  });
  writeProbes.push({
    name: `Firestore DELETE ${collection}/${SENTINEL_DOC}`,
    method: 'DELETE',
    url: `${firestoreBase}/${collection}/${SENTINEL_DOC}`,
  });
}

writeProbes.push({
  name: `Storage UPLOAD ${SENTINEL_OBJECT}`,
  method: 'POST',
  url: `${storageBase}?name=${encodeURIComponent(SENTINEL_OBJECT)}`,
  headers: { 'Content-Type': 'text/plain' },
  body: 'unauthorized-write-probe',
});
writeProbes.push({
  name: `Storage DELETE ${SENTINEL_OBJECT}`,
  method: 'DELETE',
  url: `${storageBase}/${encodeURIComponent(SENTINEL_OBJECT)}`,
});

let allBlocked = true;

for (const probe of writeProbes) {
  let status, body;
  try {
    const res = await fetch(probe.url, {
      method: probe.method,
      headers: probe.headers,
      body: probe.body,
    });
    status = res.status;
    body = await res.text();
  } catch (err) {
    console.log(`FAIL — ${probe.name}: network error: ${err.message}`);
    allBlocked = false;
    continue;
  }

  const snippet = body.slice(0, 240).replace(/\s+/g, ' ');
  const blocked = status === 401 || status === 403;

  if (blocked) {
    console.log(`PASS — ${probe.name}: ${status}`);
  } else {
    console.log(
      `FAIL — ${probe.name}: ${status} (write was NOT rejected — investigate rules + App Check). Body: ${snippet}`,
    );
    allBlocked = false;
  }
}

if (allBlocked) {
  console.log('\nAll unauthorized writes were rejected — Firestore + Storage defense looks live.');
  process.exit(0);
} else {
  console.log(
    '\nOne or more unauthorized writes were not rejected. Sentinel paths bound the blast radius; investigate immediately.',
  );
  process.exit(1);
}
