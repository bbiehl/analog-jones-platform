/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE, FIRESTORE_OPS, FirestoreOps } from '../shared/firebase.token';
import { EpisodeCategoryService } from '../junction/episode-category.service';
import { EpisodeGenreService } from '../junction/episode-genre.service';
import { EpisodeTagService } from '../junction/episode-tag.service';
import { ImageUploadService } from '../shared/image-upload.service';
import { EpisodeService } from './episode.service';
import type { Firestore } from 'firebase/firestore';

describe('EpisodeService', () => {
  let service: EpisodeService;
  let ops: { [K in keyof FirestoreOps]: ReturnType<typeof vi.fn> };
  const firestore = { __brand: 'fake-firestore' } as unknown as Firestore;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEpisodeCategoryService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEpisodeGenreService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEpisodeTagService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockImageUploadService: any;

  beforeEach(() => {
    let autoIdCounter = 0;
    ops = {
      collection: vi.fn((_db, path) => ({ __collection: path })),
      // doc(firestore, path, id) -> path/id ; doc(collectionRef) -> auto-id ref
      doc: vi.fn((arg1, arg2, arg3) => {
        if (arg2 === undefined) {
          // Called with just a collection ref — auto-generates an id
          autoIdCounter += 1;
          return { id: `auto-${autoIdCounter}`, __collection: (arg1 as { __collection?: string }).__collection };
        }
        return { __doc: `${arg2}/${arg3}` };
      }),
      query: vi.fn((coll, ...constraints) => ({ __query: { coll, constraints } })),
      orderBy: vi.fn((field, dir) => ({ __orderBy: { field, dir } })),
      where: vi.fn((field, op, value) => ({ __where: { field, op, value } })),
      limit: vi.fn((n) => ({ __limit: n })),
      getDoc: vi.fn(),
      getDocs: vi.fn(),
      getCountFromServer: vi.fn(),
      addDoc: vi.fn(),
      updateDoc: vi.fn().mockResolvedValue(undefined),
      writeBatch: vi.fn(),
    };

    mockEpisodeCategoryService = {
      getEpisodeCategoriesByEpisodeId: vi.fn().mockResolvedValue([]),
      createEpisodeCategory: vi.fn(),
      deleteEpisodeCategoriesByEpisodeId: vi.fn(),
    };
    mockEpisodeGenreService = {
      getEpisodeGenresByEpisodeId: vi.fn().mockResolvedValue([]),
      createEpisodeGenre: vi.fn(),
      deleteEpisodeGenresByEpisodeId: vi.fn(),
    };
    mockEpisodeTagService = {
      getEpisodeTagsByEpisodeId: vi.fn().mockResolvedValue([]),
      createEpisodeTag: vi.fn(),
      deleteEpisodeTagsByEpisodeId: vi.fn(),
    };
    mockImageUploadService = {
      uploadPoster: vi.fn(),
      deletePoster: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        EpisodeService,
        { provide: FIRESTORE, useValue: firestore },
        { provide: FIRESTORE_OPS, useValue: ops as unknown as FirestoreOps },
        { provide: EpisodeCategoryService, useValue: mockEpisodeCategoryService },
        { provide: EpisodeGenreService, useValue: mockEpisodeGenreService },
        { provide: EpisodeTagService, useValue: mockEpisodeTagService },
        { provide: ImageUploadService, useValue: mockImageUploadService },
      ],
    });

    service = TestBed.inject(EpisodeService);
  });

  describe('getHomeEpisodes', () => {
    it('should bundle episodes, total, and featured-with-relations under one cache call', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'ep1', data: () => ({ title: 'Featured' }) },
          { id: 'ep2', data: () => ({ title: 'Second' }) },
        ],
      });
      ops.getCountFromServer.mockResolvedValueOnce({ data: () => ({ count: 12 }) });
      mockEpisodeCategoryService.getEpisodeCategoriesByEpisodeId.mockResolvedValueOnce([
        { id: 'c1', name: 'History', slug: 'history' },
      ]);
      mockEpisodeGenreService.getEpisodeGenresByEpisodeId.mockResolvedValueOnce([
        { id: 'g1', name: 'Action', slug: 'action' },
      ]);
      mockEpisodeTagService.getEpisodeTagsByEpisodeId.mockResolvedValueOnce([
        { id: 't1', name: 'Featured', slug: 'featured' },
      ]);

      const result = await service.getHomeEpisodes();

      expect(ops.limit).toHaveBeenCalledWith(9);
      expect(mockEpisodeCategoryService.getEpisodeCategoriesByEpisodeId).toHaveBeenCalledWith('ep1');
      expect(mockEpisodeGenreService.getEpisodeGenresByEpisodeId).toHaveBeenCalledWith('ep1');
      expect(mockEpisodeTagService.getEpisodeTagsByEpisodeId).toHaveBeenCalledWith('ep1');
      expect(result.total).toBe(12);
      expect(result.episodes.map((e) => e.id)).toEqual(['ep1', 'ep2']);
      expect(result.featured).toEqual({
        id: 'ep1',
        title: 'Featured',
        categories: [{ id: 'c1', name: 'History', slug: 'history' }],
        genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
        tags: [{ id: 't1', name: 'Featured', slug: 'featured' }],
      });
    });

    it('should return featured=null when there are no episodes', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      ops.getCountFromServer.mockResolvedValueOnce({ data: () => ({ count: 0 }) });

      const result = await service.getHomeEpisodes();

      expect(result.featured).toBeNull();
      expect(result.episodes).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockEpisodeCategoryService.getEpisodeCategoriesByEpisodeId).not.toHaveBeenCalled();
    });
  });

  describe('getAllEpisodes', () => {
    it('should query episodes ordered by episodeDate desc and map docs', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'ep1', data: () => ({ title: 'One', isVisible: true }) },
          { id: 'ep2', data: () => ({ title: 'Two', isVisible: false }) },
        ],
      });

      const result = await service.getAllEpisodes();

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'episodes');
      expect(ops.orderBy).toHaveBeenCalledWith('episodeDate', 'desc');
      expect(result).toEqual([
        { id: 'ep1', title: 'One', isVisible: true },
        { id: 'ep2', title: 'Two', isVisible: false },
      ]);
    });
  });

  describe('toggleEpisodeVisibility', () => {
    it('should call updateDoc with { isVisible }', async () => {
      await service.toggleEpisodeVisibility('ep1', false);

      expect(ops.updateDoc).toHaveBeenCalledWith({ __doc: 'episodes/ep1' }, { isVisible: false });
    });
  });

  describe('getCurrentEpisode', () => {
    it('should return null when the snapshot is empty', async () => {
      ops.getDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      expect(await service.getCurrentEpisode()).toBeNull();
    });

    it('should query visible episodes ordered desc with limit 1 and return the first', async () => {
      ops.getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'ep1', data: () => ({ title: 'Latest', isVisible: true }) }],
      });

      const result = await service.getCurrentEpisode();

      expect(ops.where).toHaveBeenCalledWith('isVisible', '==', true);
      expect(ops.orderBy).toHaveBeenCalledWith('episodeDate', 'desc');
      expect(ops.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 'ep1', title: 'Latest', isVisible: true });
    });
  });

  describe('getRecentEpisodes', () => {
    it('should query visible episodes with limit 5', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [{ id: 'ep1', data: () => ({ title: 'A' }) }],
      });

      const result = await service.getRecentEpisodes();

      expect(ops.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual([{ id: 'ep1', title: 'A' }]);
    });
  });

  describe('getVisibleEpisodes', () => {
    it('should return all visible episodes when no search term', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'ep1', data: () => ({ title: 'Moon Landing' }) },
          { id: 'ep2', data: () => ({ title: 'Mars Rover' }) },
        ],
      });

      const result = await service.getVisibleEpisodes();
      expect(result).toHaveLength(2);
    });

    it('should filter case-insensitively when a search term is given', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'ep1', data: () => ({ title: 'The Moon Landing' }) },
          { id: 'ep2', data: () => ({ title: 'Mars Rover' }) },
          { id: 'ep3', data: () => ({ title: 'Moon Base Alpha' }) },
        ],
      });

      const result = await service.getVisibleEpisodes('moon');
      expect(result.map((e) => e.id)).toEqual(['ep1', 'ep3']);
    });

    it('should not filter when search term is empty string', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [{ id: 'ep1', data: () => ({ title: 'X' }) }],
      });

      const result = await service.getVisibleEpisodes('');
      expect(result).toHaveLength(1);
    });
  });

  describe('getEpisodeById', () => {
    it('should throw when the snapshot does not exist', async () => {
      ops.getDoc.mockResolvedValueOnce({ exists: () => false });
      await expect(service.getEpisodeById('missing')).rejects.toThrow(
        'Episode with id "missing" not found'
      );
    });

    it('should combine the episode with hydrated relations', async () => {
      ops.getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'ep1',
        data: () => ({ title: 'Test' }),
      });
      mockEpisodeCategoryService.getEpisodeCategoriesByEpisodeId.mockResolvedValueOnce([
        { id: 'c1', name: 'History', slug: 'history' },
      ]);
      mockEpisodeGenreService.getEpisodeGenresByEpisodeId.mockResolvedValueOnce([
        { id: 'g1', name: 'Action', slug: 'action' },
      ]);
      mockEpisodeTagService.getEpisodeTagsByEpisodeId.mockResolvedValueOnce([
        { id: 't1', name: 'Featured', slug: 'featured' },
      ]);

      const result = await service.getEpisodeById('ep1');

      expect(result).toEqual({
        id: 'ep1',
        title: 'Test',
        categories: [{ id: 'c1', name: 'History', slug: 'history' }],
        genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
        tags: [{ id: 't1', name: 'Featured', slug: 'featured' }],
      });
    });
  });

  describe('createEpisode', () => {
    const baseEpisode = {
      createdAt: { seconds: 1, nanoseconds: 0 },
      episodeDate: { seconds: 2, nanoseconds: 0 },
      intelligence: null,
      isVisible: true,
      links: { spotify: 'https://spotify.com/ep1' },
      posterUrl: null,
      title: 'New Episode',
    } as never;

    it('should batch-write the episode plus all junctions and return the new id', async () => {
      const batch = { set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      const result = await service.createEpisode(baseEpisode, ['c1', 'c2'], ['g1'], ['t1']);

      // 1 episode + 2 categories + 1 genre + 1 tag = 5 set calls
      expect(batch.set).toHaveBeenCalledTimes(5);
      // First set is the episode itself with no id field
      expect(batch.set.mock.calls[0][1]).not.toHaveProperty('id');
      expect(batch.set.mock.calls[0][1].title).toBe('New Episode');
      expect(batch.set.mock.calls[0][1].posterUrl).toBeNull();
      expect(batch.commit).toHaveBeenCalledTimes(1);
      expect(typeof result).toBe('string');
      expect(result.startsWith('auto-')).toBe(true);
    });

    it('should upload poster before batch and embed the resulting URL', async () => {
      const batch = { set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);
      mockImageUploadService.uploadPoster.mockResolvedValueOnce(
        'https://storage.example.com/poster.webp'
      );
      const file = new File(['img'], 'p.png', { type: 'image/png' });

      await service.createEpisode(baseEpisode, [], [], [], file);

      expect(mockImageUploadService.uploadPoster).toHaveBeenCalled();
      expect(batch.set.mock.calls[0][1].posterUrl).toBe(
        'https://storage.example.com/poster.webp'
      );
    });

    it('should rollback the poster upload when the batch commit fails', async () => {
      const batch = {
        set: vi.fn(),
        commit: vi.fn().mockRejectedValueOnce(new Error('write failed')),
      };
      ops.writeBatch.mockReturnValueOnce(batch);
      mockImageUploadService.uploadPoster.mockResolvedValueOnce('url');
      const file = new File(['img'], 'p.png', { type: 'image/png' });

      await expect(service.createEpisode(baseEpisode, [], [], [], file)).rejects.toThrow(
        'write failed'
      );

      expect(mockImageUploadService.deletePoster).toHaveBeenCalled();
    });

    it('should not attempt to delete a poster when commit fails and no poster was uploaded', async () => {
      const batch = {
        set: vi.fn(),
        commit: vi.fn().mockRejectedValueOnce(new Error('write failed')),
      };
      ops.writeBatch.mockReturnValueOnce(batch);

      await expect(service.createEpisode(baseEpisode, [], [], [])).rejects.toThrow('write failed');

      expect(mockImageUploadService.deletePoster).not.toHaveBeenCalled();
    });
  });

  describe('updateEpisode', () => {
    it('should update the episode doc with the supplied fields stripped of id', async () => {
      const batch = { update: vi.fn(), set: vi.fn(), delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.updateEpisode('ep1', { id: 'ep1', title: 'Updated' });

      expect(batch.update).toHaveBeenCalledWith({ __doc: 'episodes/ep1' }, { title: 'Updated' });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('should upload a new poster and include the resulting URL in the update', async () => {
      const batch = { update: vi.fn(), set: vi.fn(), delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);
      mockImageUploadService.uploadPoster.mockResolvedValueOnce('new-url');

      const file = new File(['img'], 'p.png', { type: 'image/png' });
      await service.updateEpisode('ep1', { title: 'X' }, undefined, undefined, undefined, file);

      expect(mockImageUploadService.uploadPoster).toHaveBeenCalledWith('ep1', file);
      expect(batch.update).toHaveBeenCalledWith(
        { __doc: 'episodes/ep1' },
        { title: 'X', posterUrl: 'new-url' }
      );
    });

    it('should null out posterUrl when removePoster is true', async () => {
      const batch = { update: vi.fn(), set: vi.fn(), delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.updateEpisode(
        'ep1',
        { title: 'X' },
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );

      expect(mockImageUploadService.deletePoster).toHaveBeenCalledWith('ep1');
      expect(batch.update).toHaveBeenCalledWith(
        { __doc: 'episodes/ep1' },
        { title: 'X', posterUrl: null }
      );
    });

    it('should delete existing junctions and recreate them when relation arrays are provided', async () => {
      const batch = { update: vi.fn(), set: vi.fn(), delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);
      ops.getDocs
        .mockResolvedValueOnce({ docs: [{ ref: 'old-cat' }] }) // categories
        .mockResolvedValueOnce({ docs: [{ ref: 'old-genre' }] }) // genres
        .mockResolvedValueOnce({ docs: [] }); // tags

      await service.updateEpisode('ep1', { title: 'X' }, ['c1'], ['g1'], []);

      expect(batch.delete).toHaveBeenCalledWith('old-cat');
      expect(batch.delete).toHaveBeenCalledWith('old-genre');
      expect(batch.set).toHaveBeenCalledWith(expect.anything(), {
        episodeId: 'ep1',
        categoryId: 'c1',
      });
      expect(batch.set).toHaveBeenCalledWith(expect.anything(), {
        episodeId: 'ep1',
        genreId: 'g1',
      });
    });
  });

  describe('deleteEpisode', () => {
    it('should batch-delete all junctions and the episode doc, then delete the poster', async () => {
      ops.getDocs
        .mockResolvedValueOnce({ docs: [{ ref: 'cat1' }, { ref: 'cat2' }] })
        .mockResolvedValueOnce({ docs: [{ ref: 'gen1' }] })
        .mockResolvedValueOnce({ docs: [{ ref: 'tag1' }] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisode('ep1');

      // 2 categories + 1 genre + 1 tag + 1 episode = 5 deletes
      expect(batch.delete).toHaveBeenCalledTimes(5);
      expect(batch.delete).toHaveBeenLastCalledWith({ __doc: 'episodes/ep1' });
      expect(batch.commit).toHaveBeenCalledTimes(1);
      expect(mockImageUploadService.deletePoster).toHaveBeenCalledWith('ep1');
    });

    it('should swallow poster deletion errors after the batch succeeds', async () => {
      ops.getDocs
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);
      mockImageUploadService.deletePoster.mockRejectedValueOnce(new Error('storage gone'));

      await expect(service.deleteEpisode('ep1')).resolves.toBeUndefined();
    });
  });
});
