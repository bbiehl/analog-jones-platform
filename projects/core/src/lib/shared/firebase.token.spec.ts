import { TestBed } from '@angular/core/testing';
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
import { FIRESTORE, FIRESTORE_OPS } from './firebase.token';

describe('FIRESTORE token (no factory)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('FIRESTORE throws when injected without a provider', () => {
    expect(() => TestBed.inject(FIRESTORE)).toThrow();
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
