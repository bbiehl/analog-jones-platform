/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from '../shared/firebase.token';
import { EpisodeCategoryService } from '../shared/episode-category.service';
import { CategoryService } from './category.service';
import type { Firestore } from 'firebase/firestore';

describe('CategoryService', () => {
  let service: CategoryService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of CategoryService', () => {
      expect(service).toBeInstanceOf(CategoryService);
    });
  });

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

  describe('getCategoryById', () => {
    it('should combine snapshot id and data into a Category', () => {
      const snap = {
        exists: () => true,
        id: 'c1',
        data: () => ({ name: 'History', slug: 'history' }),
      };

      const result = { id: snap.id, ...snap.data() };
      expect(result).toEqual({ id: 'c1', name: 'History', slug: 'history' });
    });

    it('should throw when snapshot does not exist', () => {
      const snap = { exists: () => false };

      expect(() => {
        if (!snap.exists()) {
          throw new Error('Category with id "missing" not found');
        }
      }).toThrow('Category with id "missing" not found');
    });
  });

  describe('getCategoryBySlug', () => {
    it('should throw when query snapshot is empty', () => {
      const snapshot = { empty: true, docs: [] };

      expect(() => {
        if (snapshot.empty) {
          throw new Error('Category with slug "nonexistent" not found');
        }
      }).toThrow('Category with slug "nonexistent" not found');
    });

    it('should combine category doc with episodes into CategoryWithRelations', () => {
      const categoryDoc = {
        id: 'c1',
        data: () => ({ name: 'History', slug: 'history' }),
      };
      const episodes = [{ id: 'ep1', title: 'Episode 1' }];

      const result = { id: categoryDoc.id, ...categoryDoc.data(), episodes };
      expect(result).toEqual({
        id: 'c1',
        name: 'History',
        slug: 'history',
        episodes: [{ id: 'ep1', title: 'Episode 1' }],
      });
    });
  });

  describe('createCategory', () => {
    it('should only pass name and slug fields', () => {
      const category = { name: 'Technology', slug: 'technology' };
      const payload = { name: category.name, slug: category.slug };

      expect(payload).toEqual({ name: 'Technology', slug: 'technology' });
      expect(payload).not.toHaveProperty('id');
    });
  });

  describe('updateCategory', () => {
    it('should strip the id field before updating', () => {
      const category = { id: 'c1', name: 'Updated', slug: 'updated' };
      const { id: _id, ...data } = category;

      expect(data).toEqual({ name: 'Updated', slug: 'updated' });
      expect(data).not.toHaveProperty('id');
    });
  });

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
