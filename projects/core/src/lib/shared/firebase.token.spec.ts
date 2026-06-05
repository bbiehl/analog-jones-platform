import { TestBed } from '@angular/core/testing';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  AUTH,
  AUTH_OPS,
  FIRESTORE,
  FIRESTORE_OPS,
  STORAGE,
  STORAGE_OPS,
} from './firebase.token';

describe('firebase tokens (no factory)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('AUTH throws when injected without a provider', () => {
    expect(() => TestBed.inject(AUTH)).toThrow();
  });

  it('FIRESTORE throws when injected without a provider', () => {
    expect(() => TestBed.inject(FIRESTORE)).toThrow();
  });

  it('STORAGE throws when injected without a provider', () => {
    expect(() => TestBed.inject(STORAGE)).toThrow();
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

describe('STORAGE_OPS default factory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('exposes the real firebase/storage functions', () => {
    const ops = TestBed.inject(STORAGE_OPS);
    expect(ops.ref).toBe(ref);
    expect(ops.uploadBytes).toBe(uploadBytes);
    expect(ops.getDownloadURL).toBe(getDownloadURL);
    expect(ops.deleteObject).toBe(deleteObject);
  });

  it('can be overridden by a test provider', () => {
    const stub = {
      ref: (() => undefined) as unknown as typeof ref,
      uploadBytes: (() => Promise.resolve()) as unknown as typeof uploadBytes,
      getDownloadURL: (() => Promise.resolve('')) as unknown as typeof getDownloadURL,
      deleteObject: (() => Promise.resolve()) as unknown as typeof deleteObject,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: STORAGE_OPS, useValue: stub }] });
    expect(TestBed.inject(STORAGE_OPS)).toBe(stub);
  });
});

describe('FIRESTORE_OPS default factory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('exposes the real firebase/firestore functions', () => {
    const ops = TestBed.inject(FIRESTORE_OPS);
    expect(ops.collection).toBe(collection);
    expect(ops.doc).toBe(doc);
    expect(ops.documentId).toBe(documentId);
    expect(ops.query).toBe(query);
    expect(ops.orderBy).toBe(orderBy);
    expect(ops.where).toBe(where);
    expect(ops.limit).toBe(limit);
    expect(ops.getDoc).toBe(getDoc);
    expect(ops.getDocs).toBe(getDocs);
    expect(ops.addDoc).toBe(addDoc);
    expect(ops.updateDoc).toBe(updateDoc);
    expect(ops.writeBatch).toBe(writeBatch);
  });

  it('can be overridden by a test provider', () => {
    const stub = {
      collection: (() => undefined) as unknown as typeof collection,
      doc: (() => undefined) as unknown as typeof doc,
      query: (() => undefined) as unknown as typeof query,
      orderBy: (() => undefined) as unknown as typeof orderBy,
      where: (() => undefined) as unknown as typeof where,
      limit: (() => undefined) as unknown as typeof limit,
      getDoc: (() => Promise.resolve()) as unknown as typeof getDoc,
      getDocs: (() => Promise.resolve()) as unknown as typeof getDocs,
      addDoc: (() => Promise.resolve()) as unknown as typeof addDoc,
      updateDoc: (() => Promise.resolve()) as unknown as typeof updateDoc,
      writeBatch: (() => undefined) as unknown as typeof writeBatch,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: FIRESTORE_OPS, useValue: stub }] });
    expect(TestBed.inject(FIRESTORE_OPS)).toBe(stub);
  });

  it('returns the same singleton instance across injections (providedIn: root)', () => {
    const a = TestBed.inject(FIRESTORE_OPS);
    const b = TestBed.inject(FIRESTORE_OPS);
    expect(a).toBe(b);
  });
});
