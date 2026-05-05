/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { AUTH, FIRESTORE, FIRESTORE_OPS, FirestoreOps } from '../shared/firebase.token';
import { UserService } from './user.service';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

describe('UserService', () => {
  let service: UserService;
  let ops: { [K in keyof FirestoreOps]: ReturnType<typeof vi.fn> };
  const firestore = { __brand: 'fake-firestore' } as unknown as Firestore;

  beforeEach(() => {
    ops = {
      collection: vi.fn((_db, path) => ({ __collection: path })),
      doc: vi.fn((_db, path, id) => ({ __doc: `${path}/${id}` })),
      query: vi.fn((coll, ...constraints) => ({ __query: { coll, constraints } })),
      orderBy: vi.fn((field) => ({ __orderBy: field })),
      where: vi.fn((field, op, value) => ({ __where: { field, op, value } })),
      limit: vi.fn((n) => ({ __limit: n })),
      getDoc: vi.fn(),
      getDocs: vi.fn(),
      addDoc: vi.fn(),
      updateDoc: vi.fn().mockResolvedValue(undefined),
      writeBatch: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: AUTH, useValue: {} as Auth },
        { provide: FIRESTORE, useValue: firestore },
        { provide: FIRESTORE_OPS, useValue: ops as unknown as FirestoreOps },
      ],
    });

    service = TestBed.inject(UserService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeInstanceOf(UserService);
    });
  });

  describe('getUserDoc', () => {
    it('should return the user when the snapshot exists', async () => {
      ops.getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'uid1',
        data: () => ({
          avatarUrl: null,
          createdAt: { seconds: 1000, nanoseconds: 0 },
          email: 'alice@example.com',
          name: 'Alice',
          role: 'admin',
        }),
      });

      const result = await service.getUserDoc('uid1');

      expect(ops.doc).toHaveBeenCalledWith(firestore, 'users', 'uid1');
      expect(result).toEqual({
        id: 'uid1',
        avatarUrl: null,
        createdAt: { seconds: 1000, nanoseconds: 0 },
        email: 'alice@example.com',
        name: 'Alice',
        role: 'admin',
      });
    });

    it('should return null when the snapshot does not exist', async () => {
      ops.getDoc.mockResolvedValueOnce({ exists: () => false });

      const result = await service.getUserDoc('missing');

      expect(result).toBeNull();
    });

    it('should propagate getDoc errors', async () => {
      ops.getDoc.mockRejectedValueOnce(new Error('permission-denied'));
      await expect(service.getUserDoc('uid1')).rejects.toThrow('permission-denied');
    });
  });

  describe('getAllUsers', () => {
    it('should query users ordered by name and map docs to AppUser objects', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'u1',
            data: () => ({ email: 'a@x.com', name: 'A', role: 'admin' }),
          },
          {
            id: 'u2',
            data: () => ({ email: 'b@x.com', name: 'B', role: 'member' }),
          },
        ],
      });

      const result = await service.getAllUsers();

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'users');
      expect(ops.orderBy).toHaveBeenCalledWith('name');
      expect(result).toEqual([
        { id: 'u1', email: 'a@x.com', name: 'A', role: 'admin' },
        { id: 'u2', email: 'b@x.com', name: 'B', role: 'member' },
      ]);
    });

    it('should return [] when there are no users', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      expect(await service.getAllUsers()).toEqual([]);
    });
  });

  // Note: signInWithGoogle, signOutUser, and listenToAuthState use static
  // imports from 'firebase/auth' which the FIRESTORE_OPS pattern does not
  // cover. Adding an AUTH_OPS injection token (mirroring STORAGE_OPS) would
  // make these methods exercisable; they are intentionally omitted here.
});
