/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE, FIRESTORE_OPS, FirestoreOps } from '../shared/firebase.token';
import { CategoryService } from './category.service';
import type { Firestore } from 'firebase/firestore';

describe('CategoryService', () => {
  let service: CategoryService;
  let ops: { [K in keyof FirestoreOps]: ReturnType<typeof vi.fn> };
  const firestore = { __brand: 'fake-firestore' } as unknown as Firestore;

  beforeEach(() => {
    ops = {
      collection: vi.fn((_db, path) => ({ __collection: path })),
      doc: vi.fn((_db, path, id) => ({ __doc: `${path}/${id}` })),
      query: vi.fn((coll, ...constraints) => ({ __query: { coll, constraints } })),
      orderBy: vi.fn((field) => ({ __orderBy: field })),
      documentId: vi.fn(() => '__name__'),
      where: vi.fn((field, op, value) => ({ __where: { field, op, value } })),
      limit: vi.fn((n) => ({ __limit: n })),
      getDoc: vi.fn(),
      getDocs: vi.fn(),
      getCountFromServer: vi.fn(),
      addDoc: vi.fn(),
      updateDoc: vi.fn().mockResolvedValue(undefined),
      writeBatch: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CategoryService,
        { provide: FIRESTORE, useValue: firestore },
        { provide: FIRESTORE_OPS, useValue: ops as unknown as FirestoreOps },
      ],
    });

    service = TestBed.inject(CategoryService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeInstanceOf(CategoryService);
    });
  });

  describe('getAllCategories', () => {
    it('should query the categories collection ordered by name and map docs to Category objects', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'c1', data: () => ({ name: 'History', slug: 'history' }) },
          { id: 'c2', data: () => ({ name: 'Science', slug: 'science' }) },
        ],
      });

      const result = await service.getAllCategories();

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'categories');
      expect(ops.orderBy).toHaveBeenCalledWith('name');
      expect(ops.query).toHaveBeenCalledTimes(1);
      expect(ops.getDocs).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { id: 'c1', name: 'History', slug: 'history' },
        { id: 'c2', name: 'Science', slug: 'science' },
      ]);
    });

    it('should return an empty array when there are no docs', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });

      const result = await service.getAllCategories();

      expect(result).toEqual([]);
    });

    it('should propagate errors from getDocs', async () => {
      ops.getDocs.mockRejectedValueOnce(new Error('firestore unavailable'));

      await expect(service.getAllCategories()).rejects.toThrow('firestore unavailable');
    });
  });

  describe('getCategoryById', () => {
    it('should return the category when the snapshot exists', async () => {
      ops.getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'c1',
        data: () => ({ name: 'History', slug: 'history' }),
      });

      const result = await service.getCategoryById('c1');

      expect(ops.doc).toHaveBeenCalledWith(firestore, 'categories', 'c1');
      expect(result).toEqual({ id: 'c1', name: 'History', slug: 'history' });
    });

    it('should throw when the snapshot does not exist', async () => {
      ops.getDoc.mockResolvedValueOnce({ exists: () => false });

      await expect(service.getCategoryById('missing')).rejects.toThrow(
        'Category with id "missing" not found'
      );
    });

    it('should propagate errors from getDoc', async () => {
      ops.getDoc.mockRejectedValueOnce(new Error('permission-denied'));

      await expect(service.getCategoryById('c1')).rejects.toThrow('permission-denied');
    });
  });

  describe('createCategory', () => {
    it('should write only name and slug and return the new doc id', async () => {
      ops.addDoc.mockResolvedValueOnce({ id: 'new-id' });

      const result = await service.createCategory({ name: 'Tech', slug: 'tech' });

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'categories');
      expect(ops.addDoc).toHaveBeenCalledWith(
        { __collection: 'categories' },
        { name: 'Tech', slug: 'tech' }
      );
      expect(result).toBe('new-id');
    });

    it('should ignore extra fields on the input object', async () => {
      ops.addDoc.mockResolvedValueOnce({ id: 'new-id' });

      await service.createCategory({
        name: 'Tech',
        slug: 'tech',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        extraneous: 'should-be-stripped',
      } as any);

      expect(ops.addDoc).toHaveBeenCalledWith(expect.anything(), {
        name: 'Tech',
        slug: 'tech',
      });
    });

    it('should propagate errors from addDoc', async () => {
      ops.addDoc.mockRejectedValueOnce(new Error('quota exceeded'));

      await expect(service.createCategory({ name: 'X', slug: 'x' })).rejects.toThrow(
        'quota exceeded'
      );
    });
  });

  describe('updateCategory', () => {
    it('should strip the id field before updating', async () => {
      await service.updateCategory('c1', { id: 'c1', name: 'Updated', slug: 'updated' });

      expect(ops.doc).toHaveBeenCalledWith(firestore, 'categories', 'c1');
      expect(ops.updateDoc).toHaveBeenCalledWith(
        { __doc: 'categories/c1' },
        { name: 'Updated', slug: 'updated' }
      );
    });

    it('should pass an empty payload through when only the id is supplied', async () => {
      await service.updateCategory('c1', { id: 'c1' });

      expect(ops.updateDoc).toHaveBeenCalledWith({ __doc: 'categories/c1' }, {});
    });

    it('should propagate errors from updateDoc', async () => {
      ops.updateDoc.mockRejectedValueOnce(new Error('not-found'));

      await expect(service.updateCategory('c1', { name: 'X' })).rejects.toThrow('not-found');
    });
  });

  describe('deleteCategory', () => {
    it('should batch-delete every junction doc plus the category doc, then commit', async () => {
      const junctionRefs = [
        { ref: { __ref: 'ec1' } },
        { ref: { __ref: 'ec2' } },
        { ref: { __ref: 'ec3' } },
      ];
      ops.getDocs.mockResolvedValueOnce({ docs: junctionRefs });

      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteCategory('c1');

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'episodeCategories');
      expect(ops.where).toHaveBeenCalledWith('categoryId', '==', 'c1');
      expect(ops.writeBatch).toHaveBeenCalledWith(firestore);
      expect(batch.delete).toHaveBeenCalledTimes(junctionRefs.length + 1);
      expect(batch.delete).toHaveBeenNthCalledWith(1, junctionRefs[0].ref);
      expect(batch.delete).toHaveBeenNthCalledWith(2, junctionRefs[1].ref);
      expect(batch.delete).toHaveBeenNthCalledWith(3, junctionRefs[2].ref);
      expect(batch.delete).toHaveBeenLastCalledWith({ __doc: 'categories/c1' });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('should still delete the category doc when no junction docs exist', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });

      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteCategory('c1');

      expect(batch.delete).toHaveBeenCalledTimes(1);
      expect(batch.delete).toHaveBeenCalledWith({ __doc: 'categories/c1' });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from batch.commit', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });

      const batch = {
        delete: vi.fn(),
        commit: vi.fn().mockRejectedValueOnce(new Error('aborted')),
      };
      ops.writeBatch.mockReturnValueOnce(batch);

      await expect(service.deleteCategory('c1')).rejects.toThrow('aborted');
    });
  });
});
