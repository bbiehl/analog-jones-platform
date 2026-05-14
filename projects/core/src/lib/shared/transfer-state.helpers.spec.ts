import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TransferState } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferCacheService } from './transfer-state.helpers';

function configure(platform: 'server' | 'browser'): TransferCacheService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(TransferCacheService);
}

describe('TransferCacheService (server)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('runs the fetcher and writes the result to TransferState', async () => {
    const svc = configure('server');
    const state = TestBed.inject(TransferState);
    const fetcher = vi.fn().mockResolvedValue({ a: 1 });

    const result = await svc.cached('k1', fetcher);

    expect(result).toEqual({ a: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    // serialized payload available for transfer
    const serialized = state.toJson();
    expect(serialized).toContain('aj:k1');
  });

  it('serializes Timestamp instances into a tagged plain object', async () => {
    const svc = configure('server');
    const state = TestBed.inject(TransferState);
    const ts = new Timestamp(1700000000, 500);
    await svc.cached('k-ts', async () => ({ at: ts, nested: [{ at: ts }] }));

    const json = JSON.parse(state.toJson());
    const stored = json['aj:k-ts'];
    expect(stored.at).toEqual({ __ts__: true, seconds: 1700000000, nanoseconds: 500 });
    expect(stored.nested[0].at).toEqual({ __ts__: true, seconds: 1700000000, nanoseconds: 500 });
  });

  it('returns the fetched result even when fetcher returns a primitive or null', async () => {
    const svc = configure('server');
    const a = await svc.cached('p1', async () => 42 as unknown as object);
    const b = await svc.cached('p2', async () => null as unknown as object);
    expect(a).toBe(42);
    expect(b).toBeNull();
  });

  it('propagates fetcher errors on the server', async () => {
    const svc = configure('server');
    const err = new Error('boom');
    await expect(svc.cached('k-err', () => Promise.reject(err))).rejects.toBe(err);
  });
});

describe('TransferCacheService (browser)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('hydrates from TransferState, revives Timestamps, and removes the key', async () => {
    const svc = configure('browser');
    const state = TestBed.inject(TransferState);
    // Simulate SSR-transferred payload
    const key = { toString: () => 'aj:k-hydrate' } as unknown as Parameters<TransferState['set']>[0];
    state.set(key, {
      at: { __ts__: true, seconds: 10, nanoseconds: 20 },
      list: [{ __ts__: true, seconds: 1, nanoseconds: 2 }],
      name: 'x',
    } as never);

    const fetcher = vi.fn();
    const result = (await svc.cached('k-hydrate', fetcher)) as {
      at: Timestamp;
      list: Timestamp[];
      name: string;
    };

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.at).toBeInstanceOf(Timestamp);
    expect(result.at.seconds).toBe(10);
    expect(result.at.nanoseconds).toBe(20);
    expect(result.list[0]).toBeInstanceOf(Timestamp);
    expect(result.name).toBe('x');
    expect(state.hasKey(key)).toBe(false);
  });

  it('memoizes hydrated values so a second call does not re-read TransferState', async () => {
    const svc = configure('browser');
    const state = TestBed.inject(TransferState);
    const key = { toString: () => 'aj:k-memo' } as unknown as Parameters<TransferState['set']>[0];
    state.set(key, { v: 1 } as never);

    const first = await svc.cached('k-memo', async () => ({ v: 999 }));
    const second = await svc.cached('k-memo', async () => ({ v: 999 }));

    expect(first).toEqual({ v: 1 });
    expect(second).toBe(first);
  });

  it('falls back to the fetcher when no TransferState entry exists and memoizes the result', async () => {
    const svc = configure('browser');
    const fetcher = vi.fn().mockResolvedValue({ v: 'fresh' });

    const a = await svc.cached('k-miss', fetcher);
    const b = await svc.cached('k-miss', fetcher);

    expect(a).toEqual({ v: 'fresh' });
    expect(b).toBe(a);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not confuse plain objects that happen to share Timestamp-shaped keys without the tag', async () => {
    const svc = configure('browser');
    const result = (await svc.cached('k-shape', async () => ({
      seconds: 5,
      nanoseconds: 6,
    }))) as { seconds: number; nanoseconds: number };
    expect(result).toEqual({ seconds: 5, nanoseconds: 6 });
    expect((result as unknown) instanceof Timestamp).toBe(false);
  });

  it('propagates fetcher errors and does not memoize the rejection', async () => {
    const svc = configure('browser');
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('nope'))
      .mockResolvedValueOnce({ ok: true });

    await expect(svc.cached('k-err', fetcher)).rejects.toThrow('nope');
    const retry = await svc.cached('k-err', fetcher);
    expect(retry).toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('handles null and array payloads through the revive path', async () => {
    const svc = configure('browser');
    const state = TestBed.inject(TransferState);
    const nullKey = { toString: () => 'aj:k-null' } as unknown as Parameters<
      TransferState['set']
    >[0];
    const arrKey = { toString: () => 'aj:k-arr' } as unknown as Parameters<TransferState['set']>[0];
    state.set(nullKey, null as never);
    state.set(arrKey, [
      { __ts__: true, seconds: 7, nanoseconds: 8 },
      { plain: true },
    ] as never);

    const nullResult = await svc.cached('k-null', async () => ({ shouldNot: 'run' }));
    const arrResult = (await svc.cached('k-arr', async () => [])) as unknown as [
      Timestamp,
      { plain: true },
    ];

    expect(nullResult).toBeNull();
    expect(arrResult[0]).toBeInstanceOf(Timestamp);
    expect(arrResult[0].seconds).toBe(7);
    expect(arrResult[1]).toEqual({ plain: true });
  });
});
