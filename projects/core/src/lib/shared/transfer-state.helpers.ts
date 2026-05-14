import {
  inject,
  Injectable,
  makeStateKey,
  PendingTasks,
  PLATFORM_ID,
  TransferState,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Timestamp } from 'firebase/firestore';

const TS_TAG = '__ts__';

function replaceTimestamps(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Timestamp) {
    return { [TS_TAG]: true, seconds: value.seconds, nanoseconds: value.nanoseconds };
  }
  if (Array.isArray(value)) return value.map(replaceTimestamps);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = replaceTimestamps(v);
  }
  return out;
}

function reviveTimestamps(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(reviveTimestamps);
  const obj = value as Record<string, unknown>;
  if (
    obj[TS_TAG] === true &&
    typeof obj['seconds'] === 'number' &&
    typeof obj['nanoseconds'] === 'number'
  ) {
    return new Timestamp(obj['seconds'] as number, obj['nanoseconds'] as number);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = reviveTimestamps(v);
  }
  return out;
}

@Injectable({ providedIn: 'root' })
export class TransferCacheService {
  private readonly transferState = inject(TransferState);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
  private readonly memo = new Map<string, unknown>();

  async cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const stateKey = makeStateKey<unknown>(`aj:${key}`);

    if (this.isServer) {
      // Firebase SDK uses raw fetch (not HttpClient), so its promises don't
      // register with Angular's stability tracking. Without an explicit pending
      // task, SSR can serialize before the fetcher resolves and the
      // transfer-state key is never written — forcing the browser to re-fetch.
      const removeTask = this.pendingTasks.add();
      try {
        const result = await fetcher();
        this.transferState.set(stateKey, replaceTimestamps(result));
        return result;
      } finally {
        removeTask();
      }
    }

    if (this.memo.has(key)) {
      return this.memo.get(key) as T;
    }

    if (this.transferState.hasKey(stateKey)) {
      const raw = this.transferState.get(stateKey, null);
      this.transferState.remove(stateKey);
      const revived = reviveTimestamps(raw) as T;
      this.memo.set(key, revived);
      return revived;
    }

    const result = await fetcher();
    this.memo.set(key, result);
    return result;
  }
}
