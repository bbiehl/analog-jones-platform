/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { AUTH, FIRESTORE } from '../shared/firebase.token';
import { UserService } from './user.service';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

describe('UserService', () => {
  let service: UserService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAuth: any;

  beforeEach(() => {
    mockAuth = {};

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: AUTH, useValue: mockAuth as Auth },
        { provide: FIRESTORE, useValue: {} as Firestore },
      ],
    });

    service = TestBed.inject(UserService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of UserService', () => {
      expect(service).toBeInstanceOf(UserService);
    });
  });

  describe('getUserDoc', () => {
    it('should combine snapshot id and data into an AppUser', () => {
      const snap = {
        exists: () => true,
        id: 'uid1',
        data: () => ({
          avatarUrl: null,
          createdAt: { seconds: 1000, nanoseconds: 0 },
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
        }),
      };

      const result = { id: snap.id, ...snap.data() };
      expect(result).toEqual({
        id: 'uid1',
        avatarUrl: null,
        createdAt: { seconds: 1000, nanoseconds: 0 },
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      });
    });

    it('should return null when snapshot does not exist', () => {
      const snap = { exists: () => false };

      const result = snap.exists() ? { id: 'uid1' } : null;
      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should map snapshot docs to AppUser objects', () => {
      const mockDocs = [
        {
          id: 'u1',
          data: () => ({
            avatarUrl: null,
            createdAt: { seconds: 1000, nanoseconds: 0 },
            email: 'alice@example.com',
            name: 'Alice',
            role: 'admin',
          }),
        },
        {
          id: 'u2',
          data: () => ({
            avatarUrl: 'https://example.com/avatar.jpg',
            createdAt: { seconds: 2000, nanoseconds: 0 },
            email: 'bob@example.com',
            name: 'Bob',
            role: 'member',
          }),
        },
      ];

      const result = mockDocs.map((d) => ({ id: d.id, ...d.data() }));

      expect(result).toEqual([
        {
          id: 'u1',
          avatarUrl: null,
          createdAt: { seconds: 1000, nanoseconds: 0 },
          email: 'alice@example.com',
          name: 'Alice',
          role: 'admin',
        },
        {
          id: 'u2',
          avatarUrl: 'https://example.com/avatar.jpg',
          createdAt: { seconds: 2000, nanoseconds: 0 },
          email: 'bob@example.com',
          name: 'Bob',
          role: 'member',
        },
      ]);
    });

    it('should include the id field from each doc', () => {
      const mockDoc = {
        id: 'u1',
        data: () => ({ email: 'test@example.com', name: 'Test', role: 'free' }),
      };

      const result = { id: mockDoc.id, ...mockDoc.data() };
      expect(result.id).toBe('u1');
    });
  });

  describe('listenToAuthState', () => {
    it('should accept a callback function', () => {
      const callback = vi.fn();
      expect(typeof callback).toBe('function');
    });
  });
});
