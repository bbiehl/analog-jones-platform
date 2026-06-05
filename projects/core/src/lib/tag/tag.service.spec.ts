/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE, FIRESTORE_OPS, FirestoreOps } from '../shared/firebase.token';
import { TagService } from './tag.service';
import type { Firestore } from 'firebase/firestore';

describe('TagService', () => {
  let service: TagService;
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
        TagService,
        { provide: FIRESTORE, useValue: firestore },
        { provide: FIRESTORE_OPS, useValue: ops as unknown as FirestoreOps },
      ],
    });

    service = TestBed.inject(TagService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeInstanceOf(TagService);
    });
  });

  describe('getAllTags', () => {
    it('should query tags ordered by name and map docs to Tag objects', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 't1', data: () => ({ name: 'Vintage', slug: 'vintage' }) },
          { id: 't2', data: () => ({ name: 'Analog', slug: 'analog' }) },
        ],
      });

      const result = await service.getAllTags();

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'tags');
      expect(ops.orderBy).toHaveBeenCalledWith('name');
      expect(result).toEqual([
        { id: 't1', name: 'Vintage', slug: 'vintage' },
        { id: 't2', name: 'Analog', slug: 'analog' },
      ]);
    });

    it('should return [] when there are no docs', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      expect(await service.getAllTags()).toEqual([]);
    });
  });

  describe('getTagById', () => {
    it('should return the tag when the snapshot exists', async () => {
      ops.getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 't1',
        data: () => ({ name: 'Vintage', slug: 'vintage' }),
      });

      const result = await service.getTagById('t1');

      expect(ops.doc).toHaveBeenCalledWith(firestore, 'tags', 't1');
      expect(result).toEqual({ id: 't1', name: 'Vintage', slug: 'vintage' });
    });

    it('should throw when the snapshot does not exist', async () => {
      ops.getDoc.mockResolvedValueOnce({ exists: () => false });
      await expect(service.getTagById('missing')).rejects.toThrow(
        'Tag with id "missing" not found'
      );
    });
  });

  describe('createTag', () => {
    it('should write only name and slug and return the new doc id', async () => {
      ops.addDoc.mockResolvedValueOnce({ id: 'new-id' });

      const result = await service.createTag({ name: 'Retro', slug: 'retro' });

      expect(ops.addDoc).toHaveBeenCalledWith(
        { __collection: 'tags' },
        { name: 'Retro', slug: 'retro' }
      );
      expect(result).toBe('new-id');
    });

    it('should propagate addDoc errors', async () => {
      ops.addDoc.mockRejectedValueOnce(new Error('quota'));
      await expect(service.createTag({ name: 'X', slug: 'x' })).rejects.toThrow('quota');
    });
  });

  describe('updateTag', () => {
    it('should strip the id field before updating', async () => {
      await service.updateTag('t1', { id: 't1', name: 'Updated', slug: 'updated' });

      expect(ops.updateDoc).toHaveBeenCalledWith(
        { __doc: 'tags/t1' },
        { name: 'Updated', slug: 'updated' }
      );
    });

    it('should propagate updateDoc errors', async () => {
      ops.updateDoc.mockRejectedValueOnce(new Error('not-found'));
      await expect(service.updateTag('t1', { name: 'X' })).rejects.toThrow('not-found');
    });
  });

  describe('deleteTag', () => {
    it('should batch-delete every junction doc plus the tag doc, then commit', async () => {
      const junctionRefs = [{ ref: { __ref: 'et1' } }, { ref: { __ref: 'et2' } }];
      ops.getDocs.mockResolvedValueOnce({ docs: junctionRefs });

      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteTag('t1');

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'episodeTags');
      expect(ops.where).toHaveBeenCalledWith('tagId', '==', 't1');
      expect(batch.delete).toHaveBeenCalledTimes(junctionRefs.length + 1);
      expect(batch.delete).toHaveBeenLastCalledWith({ __doc: 'tags/t1' });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('should still delete the tag when no junction docs exist', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteTag('t1');

      expect(batch.delete).toHaveBeenCalledTimes(1);
      expect(batch.delete).toHaveBeenCalledWith({ __doc: 'tags/t1' });
    });
  });
});
