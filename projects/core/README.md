# @aj/core

Shared Angular library for the analog-jones platform. Exposes domain models, services, stores, junction services, and Firebase injection tokens to both `admin-app` and `public-app` via the `@aj/core` path alias.

## Layout

```
projects/core/src/
  lib/
    category/  episode/  genre/  tag/  user/   # domain folders
    junction/                                  # episode-<x> many-to-many services
    shared/                                    # firebase.token, image-upload.service
    styles/                                    # theme.scss / theme-public.scss
  public-api.ts
  test-setup.ts
```

## Build & test

```bash
pnpm build:core    # ng-packagr → dist/core
pnpm test:core     # ng test core (vitest under @angular/build:unit-test)
```

Apps consume `@aj/core` from `dist/core`, so `build:core` must run before any app build/serve. The repo's `build:*` and `dev:*` scripts chain it automatically.

## Unit Test Pattern (lib services)

Services use the Firebase modular SDK via injection tokens. Tests mock those tokens — never use `vi.mock()`.

### Guiding principles

- **Mock via injection tokens.** Provide fakes for `FIRESTORE`, `STORAGE`, `STORAGE_OPS`, or other injected services in `TestBed.configureTestingModule`.
- **Do not use `vi.mock()`.** Conflicts with `@angular/build`'s vitest-mock-patch. Mock via TestBed providers instead.
- **Use `vi.stubGlobal()` for browser APIs** unavailable in jsdom (`OffscreenCanvas`, `createImageBitmap`). Always clean up with `vi.unstubAllGlobals()` in `afterEach`.
- **Test data transformations inline.** Since Firebase SDK functions are module-level imports, test the mapping/transformation logic directly rather than trying to mock `getDocs`, `getDoc`, etc.

### What to test in each service

1. **Injection** — service creates successfully with mocked providers.
2. **Data mapping** — snapshot doc → model object transformations are correct.
3. **Error paths** — not-found throws, empty snapshots handled, etc.
4. **Side effects on injected services** — verify calls to other injected services (e.g., junction service cleanup on delete).

### Domain service (primary pattern)

```typescript
/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from '../shared/firebase.token';
import { EpisodeCategoryService } from '../junction/episode-category.service';
import { CategoryService } from './category.service';
import type { Firestore } from 'firebase/firestore';

describe('CategoryService', () => {
  let service: CategoryService;
  let mockEpisodeCategoryService: any;

  beforeEach(() => {
    mockEpisodeCategoryService = {
      getEpisodesByCategorySlug: vi.fn(),
      deleteEpisodeCategoriesByCategoryId: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CategoryService,
        { provide: FIRESTORE, useValue: {} as Firestore },
        { provide: EpisodeCategoryService, useValue: mockEpisodeCategoryService },
      ],
    });

    service = TestBed.inject(CategoryService);
  });

  // 1. Verify injection
  // 2. Test data mapping logic (snapshot → model)
  // 3. Test error paths (not-found throws, etc.)
  // 4. Test side effects on injected services
});
```

### Storage service (when using `STORAGE` + `STORAGE_OPS`)

```typescript
function createMockStorageOps() {
  return {
    ref: vi.fn((_storage: unknown, path: string) => ({ fullPath: path })),
    uploadBytes: vi.fn(() => Promise.resolve()),
    getDownloadURL: vi.fn(() => Promise.resolve('https://storage.example.com/poster/ep1')),
    deleteObject: vi.fn(() => Promise.resolve()),
  };
}

TestBed.configureTestingModule({
  providers: [
    ImageUploadService,
    { provide: STORAGE, useValue: {} as FirebaseStorage },
    { provide: STORAGE_OPS, useValue: createMockStorageOps() },
  ],
});
```

### Junction service (Firestore-only)

```typescript
TestBed.configureTestingModule({
  providers: [
    EpisodeTagService,
    { provide: FIRESTORE, useValue: {} as Firestore },
  ],
});
```

### Token quick-reference

| Token | Type | When to provide |
|---|---|---|
| `FIRESTORE` | `Firestore` | All services (always required) |
| `STORAGE` | `FirebaseStorage` | Services using Firebase Storage |
| `STORAGE_OPS` | `StorageOps` | Services calling `ref`, `uploadBytes`, `getDownloadURL`, `deleteObject` |
| `AUTH` | `Auth` | Services using Firebase Auth |
| Other services | class ref | Services that `inject()` another service (e.g., junction services) |

## Unit Test Pattern (lib stores)

A SignalStore is an Angular service — test it like one. Always use `TestBed`; instantiating with `new` won't work because stores rely on `inject()` and an injection context.

### Guiding principles

- **Public API only.** Assert on signals and call methods — never spy on internal store methods or reach into implementation details.
- **Mock dependencies via DI.** Stores `inject()` their services; provide mocks/fakes in `TestBed.configureTestingModule`.
- **Do not use `vi.mock()`.** Conflicts with `@angular/build`'s vitest-mock-patch. Mock via TestBed providers instead.
- **Extract, don't spy.** If a store method grows complex, extract logic to a service, mock/fake that service — don't spy on the store's own methods.

### Three testing approaches

1. **Isolation** — mock dependencies, exercise the store's API directly (most common for lib stores).
2. **Integration** — include the store in a wider feature test alongside components.
3. **Mock the store** — when testing a component/service that consumes the store, provide a fake store.

### Isolation test (primary pattern)

```typescript
import { TestBed } from '@angular/core/testing';
import { CategoryStore } from './category.store';
import { CategoryService } from './category.service';

describe('CategoryStore', () => {
  let store: InstanceType<typeof CategoryStore>;

  const mockCategoryService = {
    getAllCategories: vi.fn().mockResolvedValue([/* ... */]),
    // ...
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CategoryStore,
        { provide: CategoryService, useValue: mockCategoryService },
      ],
    });
    store = TestBed.inject(CategoryStore);
    vi.clearAllMocks();
  });

  // 1. Verify initial state via signals
  // 2. Test methods via public signals
  // 3. Test error paths
  // 4. Test synchronous methods
});
```

### Mocking a store (when testing a consumer)

```typescript
const mockCategoryStore = {
  categories: vi.fn().mockReturnValue([]),
  loading: vi.fn().mockReturnValue(false),
  error: vi.fn().mockReturnValue(null),
  loadCategories: vi.fn(),
};

TestBed.configureTestingModule({
  providers: [
    { provide: CategoryStore, useValue: mockCategoryStore },
  ],
});
```
