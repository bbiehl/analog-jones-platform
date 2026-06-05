import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, afterAll, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

let testEnv: RulesTestEnvironment;

const projectId = `demo-firestore-rules-${Date.now()}`;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.doc('users/admin-user').set({ role: 'admin', displayName: 'Admin' });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

async function seedUser(userId: string, data: Record<string, unknown>): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(`users/${userId}`).set(data);
  });
}

function dbFor(uid: string) {
  return testEnv.authenticatedContext(uid).firestore();
}

describe('users collection role protection', () => {
  it('allows a user reading their own document', async () => {
    await seedUser('member-user', { displayName: 'Member' });
    const db = dbFor('member-user');

    await assertSucceeds(db.doc('users/member-user').get());
  });

  it('denies a user reading another user document', async () => {
    await seedUser('other-user', { displayName: 'Other' });
    const db = dbFor('member-user');

    await assertFails(db.doc('users/other-user').get());
  });

  it('denies users collection queries for admins', async () => {
    const db = dbFor('admin-user');

    await assertFails(db.collection('users').get());
  });

  it('denies users collection queries for signed-in non-admins', async () => {
    const db = dbFor('member-user');

    await assertFails(db.collection('users').get());
  });

  it('denies users collection queries for unauthenticated clients', async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(db.collection('users').get());
  });

  it('denies a user creating their own document with a role', async () => {
    const db = dbFor('member-user');

    await assertFails(db.doc('users/member-user').set({ role: 'admin', displayName: 'Member' }));
  });

  it('allows a user creating their own document without a role', async () => {
    const db = dbFor('member-user');

    await assertSucceeds(db.doc('users/member-user').set({ displayName: 'Member' }));
  });

  it('denies a user updating their own role from non-admin to admin', async () => {
    await seedUser('member-user', { role: 'member', displayName: 'Member' });
    const db = dbFor('member-user');

    await assertFails(db.doc('users/member-user').update({ role: 'admin' }));
  });

  it('denies a user adding a role to their existing role-less document', async () => {
    await seedUser('member-user', { displayName: 'Member' });
    const db = dbFor('member-user');

    await assertFails(db.doc('users/member-user').update({ role: 'admin' }));
  });

  it('allows a user updating their own non-role fields', async () => {
    await seedUser('member-user', { displayName: 'Member' });
    const db = dbFor('member-user');

    await assertSucceeds(db.doc('users/member-user').update({ displayName: 'Updated Member' }));
  });

  it('denies an admin creating a user document with a role', async () => {
    const db = dbFor('admin-user');

    await assertFails(db.doc('users/new-user').set({ role: 'admin', displayName: 'New Admin' }));
  });

  it('denies an admin updating a user document role', async () => {
    await seedUser('member-user', { role: 'member', displayName: 'Member' });
    const db = dbFor('admin-user');

    await assertFails(db.doc('users/member-user').update({ role: 'admin' }));
  });

  it('denies an admin removing a user document role', async () => {
    await seedUser('member-user', { role: 'member', displayName: 'Member' });
    const db = dbFor('admin-user');

    await assertFails(db.doc('users/member-user').set({ displayName: 'Member Without Role' }));
  });

  it('allows an admin updating non-role fields on user documents', async () => {
    await seedUser('member-user', { role: 'member', displayName: 'Member' });
    const db = dbFor('admin-user');

    await assertSucceeds(db.doc('users/member-user').update({ displayName: 'Updated By Admin' }));
  });
});

describe('explicit admin collections', () => {
  const collections = [
    'episodes',
    'tags',
    'genres',
    'categories',
    'episodeTags',
    'episodeGenres',
    'episodeCategories',
  ];

  it.each(collections)('allows public reads from %s', async (collection) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(`${collection}/doc-1`).set({ title: 'Readable' });
    });
    const db = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(db.doc(`${collection}/doc-1`).get());
    await assertSucceeds(db.collection(collection).get());
  });

  it.each(collections)('allows admins to manage %s', async (collection) => {
    const db = dbFor('admin-user');
    const doc = db.doc(`${collection}/doc-1`);

    await assertSucceeds(doc.set({ title: 'Created' }));
    await assertSucceeds(doc.update({ title: 'Updated' }));
    await assertSucceeds(doc.delete());
  });

  it('denies admin writes to unspecified collections', async () => {
    const db = dbFor('admin-user');

    await assertFails(db.doc('futureCollection/doc-1').set({ title: 'Created' }));
  });

  it('denies public reads from unspecified collections', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('futureCollection/doc-1').set({ title: 'Hidden' });
    });
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(db.doc('futureCollection/doc-1').get());
  });
});
