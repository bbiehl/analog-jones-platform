/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE, FIRESTORE_OPS, FirestoreOps } from '../shared/firebase.token';
import { EpisodeGenreService } from './episode-genre.service';
import type { Firestore } from 'firebase/firestore';

describe('EpisodeGenreService', () => {
  let service: EpisodeGenreService;
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
      documentId: vi.fn(() => '__name__'),
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
        EpisodeGenreService,
        { provide: FIRESTORE, useValue: firestore },
        { provide: FIRESTORE_OPS, useValue: ops as unknown as FirestoreOps },
      ],
    });

    service = TestBed.inject(EpisodeGenreService);
  });

  describe('createEpisodeGenre', () => {
    it('should add a junction doc with episodeId and genreId', async () => {
      await service.createEpisodeGenre('ep1', 'g1');

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'episodeGenres');
      expect(ops.addDoc).toHaveBeenCalledWith(
        { __collection: 'episodeGenres' },
        { episodeId: 'ep1', genreId: 'g1' }
      );
    });
  });

  describe('deleteEpisodeGenre', () => {
    it('should query by both episodeId and genreId and batch-delete', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [{ ref: 'a' }, { ref: 'b' }] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisodeGenre('ep1', 'g1');

      expect(ops.where).toHaveBeenCalledWith('episodeId', '==', 'ep1');
      expect(ops.where).toHaveBeenCalledWith('genreId', '==', 'g1');
      expect(batch.delete).toHaveBeenCalledTimes(2);
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteEpisodeGenresByEpisodeId', () => {
    it('should batch-delete every junction doc matching the episodeId', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [{ ref: 'a' }] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisodeGenresByEpisodeId('ep1');

      expect(ops.where).toHaveBeenCalledWith('episodeId', '==', 'ep1');
      expect(batch.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteEpisodeGenresByGenreId', () => {
    it('should batch-delete every junction doc matching the genreId', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [{ ref: 'a' }, { ref: 'b' }] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteEpisodeGenresByGenreId('g1');

      expect(ops.where).toHaveBeenCalledWith('genreId', '==', 'g1');
      expect(batch.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('getEpisodeIdsByGenreId', () => {
    it('should return unique episodeIds', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ episodeId: 'ep1' }) },
          { data: () => ({ episodeId: 'ep2' }) },
          { data: () => ({ episodeId: 'ep1' }) },
        ],
      });

      expect(await service.getEpisodeIdsByGenreId('g1')).toEqual(['ep1', 'ep2']);
    });
  });

  describe('setEpisodesForGenre', () => {
    it('should add missing episodes and remove extras', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { ref: 'ref-ep1', data: () => ({ episodeId: 'ep1' }) },
          { ref: 'ref-ep2', data: () => ({ episodeId: 'ep2' }) },
        ],
      });
      const batch = { delete: vi.fn(), set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.setEpisodesForGenre('g1', ['ep1', 'ep3']);

      expect(batch.delete).toHaveBeenCalledWith('ref-ep2');
      expect(batch.set).toHaveBeenCalledWith(expect.anything(), {
        episodeId: 'ep3',
        genreId: 'g1',
      });
    });

    it('should dedupe duplicate junctions', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { ref: 'ref-1a', data: () => ({ episodeId: 'ep1' }) },
          { ref: 'ref-1b', data: () => ({ episodeId: 'ep1' }) },
        ],
      });
      const batch = { delete: vi.fn(), set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.setEpisodesForGenre('g1', ['ep1']);

      expect(batch.delete).toHaveBeenCalledTimes(1);
      expect(batch.delete).toHaveBeenCalledWith('ref-1b');
      expect(batch.set).not.toHaveBeenCalled();
    });
  });

  describe('getEpisodeGenresByEpisodeId', () => {
    it('should hydrate genres that exist and skip missing ones', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ genreId: 'g1' }) },
          { data: () => ({ genreId: 'gone' }) },
        ],
      });
      ops.getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'g1',
          data: () => ({ name: 'Action', slug: 'action' }),
        })
        .mockResolvedValueOnce({ exists: () => false });

      const result = await service.getEpisodeGenresByEpisodeId('ep1');
      expect(result).toEqual([{ id: 'g1', name: 'Action', slug: 'action' }]);
    });
  });

  describe('getEpisodesByGenreId', () => {
    it('should batch-query episodes by documentId and return server-filtered results', async () => {
      ops.getDocs
        .mockResolvedValueOnce({
          docs: [
            { data: () => ({ episodeId: 'ep1' }) },
            { data: () => ({ episodeId: 'ep2' }) },
            { data: () => ({ episodeId: 'ep1' }) },
          ],
        })
        .mockResolvedValueOnce({
          docs: [
            { id: 'ep1', data: () => ({ title: 'V', isVisible: true }) },
          ],
        });

      const result = await service.getEpisodesByGenreId('g1');

      expect(ops.where).toHaveBeenCalledWith('genreId', '==', 'g1');
      expect(ops.where).toHaveBeenCalledWith('__name__', 'in', ['ep1', 'ep2']);
      expect(ops.where).toHaveBeenCalledWith('isVisible', '==', true);
      expect(result).toEqual([{ id: 'ep1', title: 'V', isVisible: true }]);
    });

    it('should return [] without a second query when there are no junctions', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });

      expect(await service.getEpisodesByGenreId('g1')).toEqual([]);
      expect(ops.getDocs).toHaveBeenCalledTimes(1);
    });

    it('should chunk episode ids into batches of 30', async () => {
      const docs = Array.from({ length: 35 }, (_, i) => ({
        data: () => ({ episodeId: `ep${i}` }),
      }));
      ops.getDocs
        .mockResolvedValueOnce({ docs })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });

      await service.getEpisodesByGenreId('g1');

      expect(ops.getDocs).toHaveBeenCalledTimes(3);
    });
  });});
