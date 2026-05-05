/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE, FIRESTORE_OPS, FirestoreOps } from '../shared/firebase.token';
import { EpisodeCategoryService } from './episode-category.service';
import type { Firestore } from 'firebase/firestore';

describe('EpisodeCategoryService', () => {
  let service: EpisodeCategoryService;
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
      addDoc: vi.fn().mockResolvedValue({ id: 'new-id' }),
      updateDoc: vi.fn().mockResolvedValue(undefined),
      writeBatch: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        EpisodeCategoryService,
        { provide: FIRESTORE, useValue: firestore },
        { provide: FIRESTORE_OPS, useValue: ops as unknown as FirestoreOps },
      ],
    });

    service = TestBed.inject(EpisodeCategoryService);
  });

  describe('createEpisodeCategory', () => {
    it('should add a junction doc with episodeId and categoryId', async () => {
      await service.createEpisodeCategory('ep1', 'c1');

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'episodeCategories');
      expect(ops.addDoc).toHaveBeenCalledWith(
        { __collection: 'episodeCategories' },
        { episodeId: 'ep1', categoryId: 'c1' }
      );
    });
  });

  describe('deleteEpisodeCategory', () => {
    it('should query by both episodeId and categoryId and batch-delete the matches', async () => {
      const refs = [{ ref: { __ref: 'ec1' } }, { ref: { __ref: 'ec2' } }];
      ops.getDocs.mockResolvedValueOnce({ docs: refs });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisodeCategory('ep1', 'c1');

      expect(ops.where).toHaveBeenCalledWith('episodeId', '==', 'ep1');
      expect(ops.where).toHaveBeenCalledWith('categoryId', '==', 'c1');
      expect(batch.delete).toHaveBeenCalledTimes(2);
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteEpisodeCategoriesByCategoryId', () => {
    it('should batch-delete every junction doc matching the categoryId', async () => {
      const refs = [{ ref: 'a' }, { ref: 'b' }, { ref: 'c' }];
      ops.getDocs.mockResolvedValueOnce({ docs: refs });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisodeCategoriesByCategoryId('c1');

      expect(ops.where).toHaveBeenCalledWith('categoryId', '==', 'c1');
      expect(batch.delete).toHaveBeenCalledTimes(3);
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteEpisodeCategoriesByEpisodeId', () => {
    it('should batch-delete every junction doc matching the episodeId', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [{ ref: 'a' }] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisodeCategoriesByEpisodeId('ep1');

      expect(ops.where).toHaveBeenCalledWith('episodeId', '==', 'ep1');
      expect(batch.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEpisodeIdsByCategoryId', () => {
    it('should return unique episodeIds from matching junction docs', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ episodeId: 'ep1' }) },
          { data: () => ({ episodeId: 'ep2' }) },
          { data: () => ({ episodeId: 'ep1' }) }, // duplicate
        ],
      });

      const result = await service.getEpisodeIdsByCategoryId('c1');

      expect(result).toEqual(['ep1', 'ep2']);
    });

    it('should return [] when there are no matches', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      expect(await service.getEpisodeIdsByCategoryId('c1')).toEqual([]);
    });
  });

  describe('setEpisodesForCategory', () => {
    it('should add missing episodes and delete extra ones', async () => {
      const existingDocs = [
        { ref: 'ref-ep1', data: () => ({ episodeId: 'ep1' }) }, // keep
        { ref: 'ref-ep2', data: () => ({ episodeId: 'ep2' }) }, // remove
      ];
      ops.getDocs.mockResolvedValueOnce({ docs: existingDocs });
      const batch = { delete: vi.fn(), set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.setEpisodesForCategory('c1', ['ep1', 'ep3']);

      // ep2 should be deleted
      expect(batch.delete).toHaveBeenCalledTimes(1);
      expect(batch.delete).toHaveBeenCalledWith('ref-ep2');
      // ep3 should be created
      expect(batch.set).toHaveBeenCalledTimes(1);
      expect(batch.set).toHaveBeenCalledWith(expect.anything(), {
        episodeId: 'ep3',
        categoryId: 'c1',
      });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('should dedupe existing duplicate junctions, keeping the first', async () => {
      const existingDocs = [
        { ref: 'ref-1a', data: () => ({ episodeId: 'ep1' }) },
        { ref: 'ref-1b', data: () => ({ episodeId: 'ep1' }) }, // duplicate, should be deleted
      ];
      ops.getDocs.mockResolvedValueOnce({ docs: existingDocs });
      const batch = { delete: vi.fn(), set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.setEpisodesForCategory('c1', ['ep1']);

      expect(batch.delete).toHaveBeenCalledTimes(1);
      expect(batch.delete).toHaveBeenCalledWith('ref-1b');
      expect(batch.set).not.toHaveBeenCalled();
    });

    it('should add all when nothing exists', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      const batch = { delete: vi.fn(), set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.setEpisodesForCategory('c1', ['ep1', 'ep2']);

      expect(batch.set).toHaveBeenCalledTimes(2);
      expect(batch.delete).not.toHaveBeenCalled();
    });
  });

  describe('getEpisodeCategoriesByEpisodeId', () => {
    it('should hydrate categories that exist and skip missing ones', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ categoryId: 'c1' }) },
          { data: () => ({ categoryId: 'missing' }) },
          { data: () => ({ categoryId: 'c2' }) },
        ],
      });
      ops.getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'c1',
          data: () => ({ name: 'History', slug: 'history' }),
        })
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'c2',
          data: () => ({ name: 'Science', slug: 'science' }),
        });

      const result = await service.getEpisodeCategoriesByEpisodeId('ep1');

      expect(result).toEqual([
        { id: 'c1', name: 'History', slug: 'history' },
        { id: 'c2', name: 'Science', slug: 'science' },
      ]);
    });

    it('should return [] when there are no junctions', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      expect(await service.getEpisodeCategoriesByEpisodeId('ep1')).toEqual([]);
    });
  });

  describe('getEpisodesByCategorySlug', () => {
    it('should return [] when no category matches the slug', async () => {
      ops.getDocs.mockResolvedValueOnce({ empty: true, docs: [] });

      expect(await service.getEpisodesByCategorySlug('missing')).toEqual([]);
    });

    it('should return only visible episodes for the matched category', async () => {
      ops.getDocs
        // 1st query: categories by slug
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'c1' }],
        })
        // 2nd query: junctions by categoryId
        .mockResolvedValueOnce({
          docs: [
            { data: () => ({ episodeId: 'ep1' }) },
            { data: () => ({ episodeId: 'ep2' }) },
          ],
        });
      ops.getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'ep1',
          data: () => ({ title: 'Visible', isVisible: true }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'ep2',
          data: () => ({ title: 'Hidden', isVisible: false }),
        });

      const result = await service.getEpisodesByCategorySlug('history');

      expect(result).toEqual([{ id: 'ep1', title: 'Visible', isVisible: true }]);
    });

    it('should skip episodes whose snapshot does not exist', async () => {
      ops.getDocs
        .mockResolvedValueOnce({ empty: false, docs: [{ id: 'c1' }] })
        .mockResolvedValueOnce({ docs: [{ data: () => ({ episodeId: 'ep1' }) }] });
      ops.getDoc.mockResolvedValueOnce({ exists: () => false });

      expect(await service.getEpisodesByCategorySlug('history')).toEqual([]);
    });
  });
});
