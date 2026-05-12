#!/usr/bin/env node
// Black-box probe: verify Firebase App Check enforcement on prod Firestore + Storage.
// Sends token-less GETs against endpoints whose rules allow public reads — the only
// thing that can reject them is App Check itself. Exits 0 if all are blocked, 1 otherwise.

const PROJECT = 'analog-jones-v2';
const BUCKET = 'analog-jones-v2.firebasestorage.app';
const STORAGE_OBJECT = process.env.APPCHECK_PROBE_STORAGE_OBJECT;

// Per probe, `expect` is the regex that confirms the rejection came from App Check.
// Firestore REST returns a generic PERMISSION_DENIED on App Check rejection — since
// firestore.rules allow public reads on these collections, that 403 IS the App Check signal.
// Storage REST explicitly mentions App Check in the body.
const probes = [
  {
    name: 'Firestore read (episodes)',
    url: `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/episodes?pageSize=1`,
    expect: /permission_denied/i,
  },
  {
    name: 'Firestore read (tags)',
    url: `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/tags?pageSize=1`,
    expect: /permission_denied/i,
  },
  {
    name: 'Storage list',
    url: `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?maxResults=1`,
    expect: /app[- ]?check/i,
  },
  STORAGE_OBJECT && {
    name: `Storage object metadata (${STORAGE_OBJECT})`,
    url: `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(STORAGE_OBJECT)}`,
    expect: /app[- ]?check/i,
  },
].filter(Boolean);

let allBlocked = true;

for (const { name, url, expect } of probes) {
  let status, body;
  try {
    const res = await fetch(url);
    status = res.status;
    body = await res.text();
  } catch (err) {
    console.log(`FAIL — ${name}: network error: ${err.message}`);
    allBlocked = false;
    continue;
  }

  const snippet = body.slice(0, 240).replace(/\s+/g, ' ');
  const blocked = status === 401 || status === 403;
  const matched = expect.test(body);

  if (blocked && matched) {
    console.log(`PASS — ${name}: ${status} matching ${expect}`);
  } else if (blocked) {
    console.log(`AMBIGUOUS — ${name}: ${status} but body did not match ${expect}. Body: ${snippet}`);
    allBlocked = false;
  } else {
    console.log(`FAIL — ${name}: ${status} (request succeeded — App Check NOT blocking). Body: ${snippet}`);
    allBlocked = false;
  }
}

if (allBlocked) {
  console.log('\nAll probes blocked with App Check errors — enforcement looks live.');
  process.exit(0);
} else {
  console.log('\nOne or more probes were not cleanly blocked by App Check. Investigate.');
  process.exit(1);
}
