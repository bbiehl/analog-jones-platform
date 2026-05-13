/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE, FIRESTORE_OPS, FirestoreOps } from '../shared/firebase.token';
import { EpisodeTagService } from './episode-tag.service';
import type { Firestore } from 'firebase/firestore';

describe('EpisodeTagService', () => {
  let service: EpisodeTagService;
  let ops: { [K in keyof FirestoreOps]: ReturnType<typeof vi.fn> };
  const firestore = { __brand: 'fake-firestore' } as unknown as Firestore;

  beforeEach(() => {
    ops = {
      collection: vi.fn((_db, path) => ({ __collection: path })),
      doc: vi.fn((arg1, arg2, arg3) =>
        arg2 === undefined
          ? { id: 'auto', __collection: (arg1 as { __collection?: string }).__collection }
          : { __doc: `${arg2}/${arg3}` }
      ),
      query: vi.fn((coll, ...constraints) => ({ __query: { coll, constraints } })),
      orderBy: vi.fn((field) => ({ __orderBy: field })),
      where: vi.fn((field, op, value) => ({ __where: { field, op, value } })),
      limit: vi.fn((n) => ({ __limit: n })),
      getDoc: vi.fn(),
      getDocs: vi.fn(),
      getCountFromServer: vi.fn(),
      addDoc: vi.fn().mockResolvedValue({ id: 'new-id' }),
      updateDoc: vi.fn().mockResolvedValue(undefined),
      writeBatch: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        EpisodeTagService,
        { provide: FIRESTORE, useValue: firestore },
        { provide: FIRESTORE_OPS, useValue: ops as unknown as FirestoreOps },
      ],
    });

    service = TestBed.inject(EpisodeTagService);
  });

  describe('createEpisodeTag', () => {
    it('should add a junction doc with episodeId and tagId', async () => {
      await service.createEpisodeTag('ep1', 't1');

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'episodeTags');
      expect(ops.addDoc).toHaveBeenCalledWith(
        { __collection: 'episodeTags' },
        { episodeId: 'ep1', tagId: 't1' }
      );
    });
  });

  describe('deleteEpisodeTag', () => {
    it('should query by both episodeId and tagId and batch-delete', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [{ ref: 'a' }] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisodeTag('ep1', 't1');

      expect(ops.where).toHaveBeenCalledWith('episodeId', '==', 'ep1');
      expect(ops.where).toHaveBeenCalledWith('tagId', '==', 't1');
      expect(batch.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteEpisodeTagsByTagId', () => {
    it('should batch-delete every junction matching the tagId', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [{ ref: 'a' }, { ref: 'b' }] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisodeTagsByTagId('t1');

      expect(ops.where).toHaveBeenCalledWith('tagId', '==', 't1');
      expect(batch.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteEpisodeTagsByEpisodeId', () => {
    it('should batch-delete every junction matching the episodeId', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [{ ref: 'a' }] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisodeTagsByEpisodeId('ep1');

      expect(ops.where).toHaveBeenCalledWith('episodeId', '==', 'ep1');
      expect(batch.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEpisodeIdsByTagId', () => {
    it('should return unique episodeIds', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ episodeId: 'ep1' }) },
          { data: () => ({ episodeId: 'ep1' }) },
        ],
      });

      expect(await service.getEpisodeIdsByTagId('t1')).toEqual(['ep1']);
    });
  });

  describe('setEpisodesForTag', () => {
    it('should add missing episodes and delete extras', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { ref: 'ref-ep1', data: () => ({ episodeId: 'ep1' }) },
          { ref: 'ref-ep2', data: () => ({ episodeId: 'ep2' }) },
        ],
      });
      const batch = { delete: vi.fn(), set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.setEpisodesForTag('t1', ['ep1', 'ep3']);

      expect(batch.delete).toHaveBeenCalledWith('ref-ep2');
      expect(batch.set).toHaveBeenCalledWith(expect.anything(), {
        episodeId: 'ep3',
        tagId: 't1',
      });
    });
  });

  describe('getEpisodeTagsByEpisodeId', () => {
    it('should hydrate tags that exist and skip missing ones', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ tagId: 't1' }) },
          { data: () => ({ tagId: 'gone' }) },
        ],
      });
      ops.getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          id: 't1',
          data: () => ({ name: 'Featured', slug: 'featured' }),
        })
        .mockResolvedValueOnce({ exists: () => false });

      expect(await service.getEpisodeTagsByEpisodeId('ep1')).toEqual([
        { id: 't1', name: 'Featured', slug: 'featured' },
      ]);
    });
  });

  describe('getEpisodesByTagId', () => {
    it('should return only visible episodes', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ episodeId: 'ep1' }) },
          { data: () => ({ episodeId: 'ep2' }) },
        ],
      });
      ops.getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'ep1',
          data: () => ({ title: 'V', isVisible: true }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'ep2',
          data: () => ({ title: 'H', isVisible: false }),
        });

      expect(await service.getEpisodesByTagId('t1')).toEqual([
        { id: 'ep1', title: 'V', isVisible: true },
      ]);
    });

    it('should skip episodes that do not exist', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ episodeId: 'ep1' }) }],
      });
      ops.getDoc.mockResolvedValueOnce({ exists: () => false });

      expect(await service.getEpisodesByTagId('t1')).toEqual([]);
    });
  });
});
