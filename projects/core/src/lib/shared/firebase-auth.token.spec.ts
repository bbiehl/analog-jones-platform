import { TestBed } from '@angular/core/testing';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { AUTH, AUTH_OPS } from './firebase-auth.token';

describe('AUTH token (no factory)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('AUTH throws when injected without a provider', () => {
    expect(() => TestBed.inject(AUTH)).toThrow();
  });

  it('returns the value provided in TestBed for AUTH', () => {
    const fakeAuth = { app: 'fake' } as unknown;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AUTH, useValue: fakeAuth }] });
    expect(TestBed.inject(AUTH)).toBe(fakeAuth);
  });
});

describe('AUTH_OPS default factory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('exposes the real firebase/auth functions', () => {
    const ops = TestBed.inject(AUTH_OPS);
    expect(ops.GoogleAuthProvider).toBe(GoogleAuthProvider);
    expect(ops.signInWithPopup).toBe(signInWithPopup);
    expect(ops.signOut).toBe(signOut);
    expect(ops.onAuthStateChanged).toBe(onAuthStateChanged);
  });

  it('can be overridden by a test provider', () => {
    const stub = {
      GoogleAuthProvider: class {} as unknown as typeof GoogleAuthProvider,
      signInWithPopup: (() => Promise.resolve()) as unknown as typeof signInWithPopup,
      signOut: (() => Promise.resolve()) as unknown as typeof signOut,
      onAuthStateChanged: (() => () => undefined) as unknown as typeof onAuthStateChanged,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AUTH_OPS, useValue: stub }] });
    expect(TestBed.inject(AUTH_OPS)).toBe(stub);
  });
});
