/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { CategoryStore } from './category.store';
import { CategoryService } from './category.service';
import { Category, CategoryWithRelations } from './category.model';

describe('CategoryStore', () => {
  let store: InstanceType<typeof CategoryStore>;

  const mockCategories: Category[] = [
    { id: '1', name: 'Music', slug: 'music' },
    { id: '2', name: 'Tech', slug: 'tech' },
  ];

  const mockCategoryWithRelations: CategoryWithRelations = {
    id: '1',
    name: 'Music',
    slug: 'music',
    episodes: [],
  };

  const mockCategoryService = {
    getAllCategories: vi.fn().mockResolvedValue(mockCategories),
    getCategoryById: vi.fn().mockResolvedValue(mockCategories[0]),
    getCategoryBySlug: vi.fn().mockResolvedValue(mockCategoryWithRelations),
    createCategory: vi.fn().mockResolvedValue('new-id'),
    updateCategory: vi.fn().mockResolvedValue(undefined),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CategoryStore, { provide: CategoryService, useValue: mockCategoryService }],
    });
    store = TestBed.inject(CategoryStore);
    vi.clearAllMocks();
    // Re-set default resolved values after clearAllMocks
    mockCategoryService.getAllCategories.mockResolvedValue(mockCategories);
    mockCategoryService.getCategoryById.mockResolvedValue(mockCategories[0]);
    mockCategoryService.getCategoryBySlug.mockResolvedValue(mockCategoryWithRelations);
    mockCategoryService.createCategory.mockResolvedValue('new-id');
    mockCategoryService.updateCategory.mockResolvedValue(undefined);
    mockCategoryService.deleteCategory.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have empty categories', () => {
      expect(store.categories()).toEqual([]);
    });

    it('should have null selectedCategory', () => {
      expect(store.selectedCategory()).toBeNull();
    });

    it('should have loading false', () => {
      expect(store.loading()).toBe(false);
    });

    it('should have null error', () => {
      expect(store.error()).toBeNull();
    });
  });

  describe('loadCategories', () => {
    it('should load categories from service', async () => {
      await store.loadCategories();

      expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
      expect(store.categories()).toEqual(mockCategories);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should set error on failure', async () => {
      mockCategoryService.getAllCategories.mockRejectedValueOnce(new Error('Network error'));

      await store.loadCategories();

      expect(store.error()).toBe('Network error');
      expect(store.loading()).toBe(false);
      expect(store.categories()).toEqual([]);
    });
  });

  describe('loadCategoryById', () => {
    it('should load category and set selectedCategory with empty episodes', async () => {
      await store.loadCategoryById('1');

      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith('1');
      expect(store.selectedCategory()).toEqual({
        ...mockCategories[0],
        episodes: [],
      });
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockCategoryService.getCategoryById.mockRejectedValueOnce(
        new Error('Category with id "missing" not found')
      );

      await store.loadCategoryById('missing');

      expect(store.error()).toBe('Category with id "missing" not found');
      expect(store.loading()).toBe(false);
      expect(store.selectedCategory()).toBeNull();
    });
  });

  describe('loadCategoryBySlug', () => {
    it('should load category by slug and set selectedCategory', async () => {
      await store.loadCategoryBySlug('music');

      expect(mockCategoryService.getCategoryBySlug).toHaveBeenCalledWith('music');
      expect(store.selectedCategory()).toEqual(mockCategoryWithRelations);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockCategoryService.getCategoryBySlug.mockRejectedValueOnce(
        new Error('Category with slug "unknown" not found')
      );

      await store.loadCategoryBySlug('unknown');

      expect(store.error()).toBe('Category with slug "unknown" not found');
      expect(store.loading()).toBe(false);
    });
  });

  describe('createCategory', () => {
    it('should create category and reload all categories', async () => {
      const newCategory: Omit<Category, 'id'> = { name: 'Science', slug: 'science' };

      await store.createCategory(newCategory);

      expect(mockCategoryService.createCategory).toHaveBeenCalledWith(newCategory);
      expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
      expect(store.categories()).toEqual(mockCategories);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockCategoryService.createCategory.mockRejectedValueOnce(new Error('Create failed'));

      await store.createCategory({ name: 'Fail', slug: 'fail' });

      expect(store.error()).toBe('Create failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('updateCategory', () => {
    it('should update category and reload all categories', async () => {
      await store.updateCategory('1', { name: 'Updated Music' });

      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith('1', {
        name: 'Updated Music',
      });
      expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
      expect(store.categories()).toEqual(mockCategories);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockCategoryService.updateCategory.mockRejectedValueOnce(new Error('Update failed'));

      await store.updateCategory('1', { name: 'Fail' });

      expect(store.error()).toBe('Update failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category and reload all categories', async () => {
      await store.deleteCategory('1');

      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith('1');
      expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
      expect(store.categories()).toEqual(mockCategories);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockCategoryService.deleteCategory.mockRejectedValueOnce(new Error('Delete failed'));

      await store.deleteCategory('1');

      expect(store.error()).toBe('Delete failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('clearSelectedCategory', () => {
    it('should set selectedCategory to null', async () => {
      // First load a category so selectedCategory is set
      await store.loadCategoryBySlug('music');
      expect(store.selectedCategory()).not.toBeNull();

      store.clearSelectedCategory();

      expect(store.selectedCategory()).toBeNull();
    });
  });
});
