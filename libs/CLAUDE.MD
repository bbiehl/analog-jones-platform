# Unit Test Pattern (lib services)

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

Follow this exact structure — do not explore other test files for reference:

```typescript
/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from '../shared/firebase.token';
import { EpisodeCategoryService } from '../shared/episode-category.service';
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
  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of CategoryService', () => {
      expect(service).toBeInstanceOf(CategoryService);
    });
  });

  // 2. Test data mapping logic
  describe('getAllCategories', () => {
    it('should map snapshot docs to Category objects', () => {
      const mockDocs = [
        { id: 'c1', data: () => ({ name: 'History', slug: 'history' }) },
        { id: 'c2', data: () => ({ name: 'Science', slug: 'science' }) },
      ];

      const result = mockDocs.map((d) => ({ id: d.id, ...d.data() }));

      expect(result).toEqual([
        { id: 'c1', name: 'History', slug: 'history' },
        { id: 'c2', name: 'Science', slug: 'science' },
      ]);
    });
  });

  // 3. Test error paths
  describe('getCategoryById', () => {
    it('should throw when snapshot does not exist', () => {
      const snap = { exists: () => false };

      expect(() => {
        if (!snap.exists()) {
          throw new Error('Category with id "missing" not found');
        }
      }).toThrow('Category with id "missing" not found');
    });
  });

  // 4. Test side effects on injected services
  describe('deleteCategory', () => {
    it('should call episodeCategoryService.deleteEpisodeCategoriesByCategoryId', async () => {
      mockEpisodeCategoryService.deleteEpisodeCategoriesByCategoryId.mockResolvedValue(undefined);

      await mockEpisodeCategoryService.deleteEpisodeCategoriesByCategoryId('c1');

      expect(mockEpisodeCategoryService.deleteEpisodeCategoriesByCategoryId).toHaveBeenCalledWith(
        'c1'
      );
    });
  });
});
```

### Storage service (when using `STORAGE` + `STORAGE_OPS`)

```typescript
/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { STORAGE, STORAGE_OPS } from './firebase.token';
import { ImageUploadService } from './image-upload.service';
import type { FirebaseStorage } from 'firebase/storage';

function createMockStorageOps() {
  return {
    ref: vi.fn((_storage: unknown, path: string) => ({ fullPath: path })),
    uploadBytes: vi.fn(() => Promise.resolve()),
    getDownloadURL: vi.fn(() => Promise.resolve('https://storage.example.com/poster/ep1')),
    deleteObject: vi.fn(() => Promise.resolve()),
  };
}

describe('ImageUploadService', () => {
  let service: ImageUploadService;
  let mockOps: ReturnType<typeof createMockStorageOps>;

  beforeEach(() => {
    mockOps = createMockStorageOps();

    TestBed.configureTestingModule({
      providers: [
        ImageUploadService,
        { provide: STORAGE, useValue: {} as FirebaseStorage },
        { provide: STORAGE_OPS, useValue: mockOps },
      ],
    });

    service = TestBed.inject(ImageUploadService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Verify mockOps calls: ref path, uploadBytes args, getDownloadURL return
  // Use vi.stubGlobal('OffscreenCanvas', ...) for canvas-dependent methods
});
```

### Junction service (Firestore-only, no other injected services)

```typescript
/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from './firebase.token';
import { EpisodeTagService } from './episode-tag.service';
import type { Firestore } from 'firebase/firestore';

describe('EpisodeTagService', () => {
  let service: EpisodeTagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EpisodeTagService,
        { provide: FIRESTORE, useValue: {} as Firestore },
      ],
    });

    service = TestBed.inject(EpisodeTagService);
  });

  // Test inline data transformations:
  // - junction payload shape ({ episodeId, tagId })
  // - snapshot → model mapping with exists() filtering
  // - empty snapshot handling
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

# Unit Test Pattern (lib stores)

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

Follow this exact structure — do not explore other test files for reference:

```typescript
import { TestBed } from '@angular/core/testing';
import { CategoryStore } from './category.store';
import { CategoryService } from './category.service';

describe('CategoryStore', () => {
  let store: InstanceType<typeof CategoryStore>;

  const mockCategories = [
    { id: '1', name: 'Music', slug: 'music' },
    { id: '2', name: 'Tech', slug: 'tech' },
  ];

  const mockCategoryService = {
    getAllCategories: vi.fn().mockResolvedValue(mockCategories),
    getCategoryById: vi.fn().mockResolvedValue(mockCategories[0]),
    getCategoryBySlug: vi.fn().mockResolvedValue(mockCategories[0]),
    createCategory: vi.fn().mockResolvedValue(undefined),
    updateCategory: vi.fn().mockResolvedValue(undefined),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
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

  // 1. Verify initial state
  it('should have correct initial state', () => {
    expect(store.categories()).toEqual([]);
    expect(store.selectedCategory()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  // 2. Test methods via public signals
  it('should load categories', async () => {
    await store.loadCategories();

    expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
    expect(store.categories()).toEqual(mockCategories);
    expect(store.loading()).toBe(false);
  });

  // 3. Test error paths
  it('should set error on failure', async () => {
    mockCategoryService.getAllCategories.mockRejectedValueOnce(new Error('Network error'));

    await store.loadCategories();

    expect(store.error()).toBe('Network error');
    expect(store.loading()).toBe(false);
  });

  // 4. Test synchronous methods
  it('should clear selected category', () => {
    store.clearSelectedCategory();

    expect(store.selectedCategory()).toBeNull();
  });
});
```

### Mocking a store (when testing a consumer)

```typescript
import { TestBed } from '@angular/core/testing';
import { CategoryStore } from '../category/category.store';
import { MyComponent } from './my.component';

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
