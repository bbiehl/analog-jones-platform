/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { EpisodeStore } from './episode.store';
import { EpisodeService } from './episode.service';
import { EpisodeCategoryService } from '../junction/episode-category.service';
import { EpisodeGenreService } from '../junction/episode-genre.service';
import { EpisodeTagService } from '../junction/episode-tag.service';
import { Episode, EpisodeWithRelations } from './episode.model';

describe('EpisodeStore', () => {
  let store: InstanceType<typeof EpisodeStore>;

  const mockEpisodes: Episode[] = [
    {
      id: 'ep1',
      createdAt: Timestamp.fromDate(new Date('2026-01-01')),
      episodeDate: Timestamp.fromDate(new Date('2026-01-01')),
      intelligence: 'Some notes',
      isVisible: true,
      links: { spotify: 'https://spotify.com/ep1', youtube: 'https://youtube.com/ep1' },
      posterUrl: 'https://storage.example.com/poster/ep1',
      title: 'Episode One',
    },
    {
      id: 'ep2',
      createdAt: Timestamp.fromDate(new Date('2026-02-01')),
      episodeDate: Timestamp.fromDate(new Date('2026-02-01')),
      intelligence: null,
      isVisible: false,
      links: {},
      posterUrl: null,
      title: 'Episode Two',
    },
  ];

  const mockEpisodeWithRelations: EpisodeWithRelations = {
    ...mockEpisodes[0],
    categories: [{ id: 'c1', name: 'History', slug: 'history' }],
    genres: [{ id: 'g1', name: 'Documentary', slug: 'documentary' }],
    tags: [{ id: 't1', name: 'WWII', slug: 'wwii' }],
  };

  const mockEpisodeService = {
    getAllEpisodes: vi.fn().mockResolvedValue(mockEpisodes),
    getCurrentEpisode: vi.fn().mockResolvedValue(mockEpisodes[0]),
    getRecentEpisodes: vi.fn().mockResolvedValue(mockEpisodes),
    getVisibleEpisodes: vi.fn().mockResolvedValue([mockEpisodes[0]]),
    getEpisodeById: vi.fn().mockResolvedValue(mockEpisodeWithRelations),
    toggleEpisodeVisibility: vi.fn().mockResolvedValue(undefined),
    createEpisode: vi.fn().mockResolvedValue('new-id'),
    updateEpisode: vi.fn().mockResolvedValue(undefined),
    deleteEpisode: vi.fn().mockResolvedValue(undefined),
  };

  const mockEpisodeCategoryService = {
    getEpisodeCategoriesByEpisodeId: vi.fn().mockResolvedValue([]),
  };
  const mockEpisodeGenreService = {
    getEpisodeGenresByEpisodeId: vi.fn().mockResolvedValue([]),
  };
  const mockEpisodeTagService = {
    getEpisodeTagsByEpisodeId: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EpisodeStore,
        { provide: EpisodeService, useValue: mockEpisodeService },
        { provide: EpisodeCategoryService, useValue: mockEpisodeCategoryService },
        { provide: EpisodeGenreService, useValue: mockEpisodeGenreService },
        { provide: EpisodeTagService, useValue: mockEpisodeTagService },
      ],
    });
    store = TestBed.inject(EpisodeStore);
    vi.clearAllMocks();
    // Re-set default resolved values after clearAllMocks
    mockEpisodeService.getAllEpisodes.mockResolvedValue(mockEpisodes);
    mockEpisodeService.getCurrentEpisode.mockResolvedValue(mockEpisodes[0]);
    mockEpisodeService.getRecentEpisodes.mockResolvedValue(mockEpisodes);
    mockEpisodeService.getVisibleEpisodes.mockResolvedValue([mockEpisodes[0]]);
    mockEpisodeService.getEpisodeById.mockResolvedValue(mockEpisodeWithRelations);
    mockEpisodeService.toggleEpisodeVisibility.mockResolvedValue(undefined);
    mockEpisodeService.createEpisode.mockResolvedValue('new-id');
    mockEpisodeService.updateEpisode.mockResolvedValue(undefined);
    mockEpisodeService.deleteEpisode.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have empty episodes', () => {
      expect(store.episodes()).toEqual([]);
    });

    it('should have null currentEpisode', () => {
      expect(store.currentEpisode()).toBeNull();
    });

    it('should have empty recentEpisodes', () => {
      expect(store.recentEpisodes()).toEqual([]);
    });

    it('should have null selectedEpisode', () => {
      expect(store.selectedEpisode()).toBeNull();
    });

    it('should have loading false', () => {
      expect(store.loading()).toBe(false);
    });

    it('should have null error', () => {
      expect(store.error()).toBeNull();
    });
  });

  describe('loadEpisodes', () => {
    it('should load episodes from service', async () => {
      await store.loadEpisodes();

      expect(mockEpisodeService.getAllEpisodes).toHaveBeenCalled();
      expect(store.episodes()).toEqual(mockEpisodes);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should set error on failure', async () => {
      mockEpisodeService.getAllEpisodes.mockRejectedValueOnce(new Error('Network error'));

      await store.loadEpisodes();

      expect(store.error()).toBe('Network error');
      expect(store.loading()).toBe(false);
      expect(store.episodes()).toEqual([]);
    });
  });

  describe('loadCurrentEpisode', () => {
    it('should load current episode from service', async () => {
      await store.loadCurrentEpisode();

      expect(mockEpisodeService.getCurrentEpisode).toHaveBeenCalled();
      expect(store.currentEpisode()).toEqual(mockEpisodes[0]);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockEpisodeService.getCurrentEpisode.mockRejectedValueOnce(new Error('Fetch failed'));

      await store.loadCurrentEpisode();

      expect(store.error()).toBe('Fetch failed');
      expect(store.loading()).toBe(false);
      expect(store.currentEpisode()).toBeNull();
    });
  });

  describe('loadRecentEpisodes', () => {
    it('should load recent episodes from service', async () => {
      await store.loadRecentEpisodes();

      expect(mockEpisodeService.getRecentEpisodes).toHaveBeenCalled();
      expect(store.recentEpisodes()).toEqual(mockEpisodes);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockEpisodeService.getRecentEpisodes.mockRejectedValueOnce(new Error('Fetch failed'));

      await store.loadRecentEpisodes();

      expect(store.error()).toBe('Fetch failed');
      expect(store.loading()).toBe(false);
      expect(store.recentEpisodes()).toEqual([]);
    });
  });

  describe('loadVisibleEpisodes', () => {
    it('should load visible episodes without search term', async () => {
      await store.loadVisibleEpisodes();

      expect(mockEpisodeService.getVisibleEpisodes).toHaveBeenCalledWith(undefined);
      expect(store.episodes()).toEqual([mockEpisodes[0]]);
      expect(store.loading()).toBe(false);
    });

    it('should load visible episodes with search term', async () => {
      await store.loadVisibleEpisodes('Episode');

      expect(mockEpisodeService.getVisibleEpisodes).toHaveBeenCalledWith('Episode');
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockEpisodeService.getVisibleEpisodes.mockRejectedValueOnce(new Error('Search failed'));

      await store.loadVisibleEpisodes('test');

      expect(store.error()).toBe('Search failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('loadEpisodeById', () => {
    it('should load episode by id and set selectedEpisode', async () => {
      await store.loadEpisodeById('ep1');

      expect(mockEpisodeService.getEpisodeById).toHaveBeenCalledWith('ep1');
      expect(store.selectedEpisode()).toEqual(mockEpisodeWithRelations);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockEpisodeService.getEpisodeById.mockRejectedValueOnce(
        new Error('Episode with id "missing" not found')
      );

      await store.loadEpisodeById('missing');

      expect(store.error()).toBe('Episode with id "missing" not found');
      expect(store.loading()).toBe(false);
      expect(store.selectedEpisode()).toBeNull();
    });

    it('should ignore results from superseded calls when a newer call resolves first', async () => {
      const episodeB: EpisodeWithRelations = { ...mockEpisodeWithRelations, id: 'ep-B' };

      let resolveA!: (v: EpisodeWithRelations) => void;
      const pendingA = new Promise<EpisodeWithRelations>((r) => (resolveA = r));

      mockEpisodeService.getEpisodeById.mockImplementationOnce(() => pendingA);
      mockEpisodeService.getEpisodeById.mockResolvedValueOnce(episodeB);

      const callA = store.loadEpisodeById('ep-A');
      const callB = store.loadEpisodeById('ep-B');

      await callB;
      expect(store.selectedEpisode()).toEqual(episodeB);
      expect(store.loading()).toBe(false);

      resolveA(mockEpisodeWithRelations);
      await callA;

      expect(store.selectedEpisode()).toEqual(episodeB);
      expect(store.loading()).toBe(false);
    });

    it('should not surface errors from superseded calls', async () => {
      let rejectA!: (e: Error) => void;
      const pendingA = new Promise<EpisodeWithRelations>((_, r) => (rejectA = r));

      mockEpisodeService.getEpisodeById.mockImplementationOnce(() => pendingA);
      mockEpisodeService.getEpisodeById.mockResolvedValueOnce(mockEpisodeWithRelations);

      const callA = store.loadEpisodeById('ep-A');
      const callB = store.loadEpisodeById('ep-B');

      await callB;
      expect(store.error()).toBeNull();

      rejectA(new Error('stale failure'));
      await callA;

      expect(store.error()).toBeNull();
      expect(store.selectedEpisode()).toEqual(mockEpisodeWithRelations);
    });
  });

  describe('toggleEpisodeVisibility', () => {
    it('should toggle visibility and reload all episodes', async () => {
      await store.toggleEpisodeVisibility('ep1', false);

      expect(mockEpisodeService.toggleEpisodeVisibility).toHaveBeenCalledWith('ep1', false);
      expect(mockEpisodeService.getAllEpisodes).toHaveBeenCalled();
      expect(store.episodes()).toEqual(mockEpisodes);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockEpisodeService.toggleEpisodeVisibility.mockRejectedValueOnce(
        new Error('Toggle failed')
      );

      await store.toggleEpisodeVisibility('ep1', false);

      expect(store.error()).toBe('Toggle failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('createEpisode', () => {
    it('should create episode and reload all episodes', async () => {
      const newEpisode: Omit<Episode, 'id'> = {
        createdAt: Timestamp.fromDate(new Date('2026-03-01')),
        episodeDate: Timestamp.fromDate(new Date('2026-03-01')),
        intelligence: null,
        isVisible: true,
        links: {},
        posterUrl: null,
        title: 'New Episode',
      };
      const categoryIds = ['c1'];
      const genreIds = ['g1'];
      const tagIds = ['t1'];

      await store.createEpisode(newEpisode, categoryIds, genreIds, tagIds);

      expect(mockEpisodeService.createEpisode).toHaveBeenCalledWith(
        newEpisode,
        categoryIds,
        genreIds,
        tagIds,
        undefined
      );
      expect(mockEpisodeService.getAllEpisodes).toHaveBeenCalled();
      expect(store.episodes()).toEqual(mockEpisodes);
      expect(store.loading()).toBe(false);
    });

    it('should pass poster file when provided', async () => {
      const newEpisode: Omit<Episode, 'id'> = {
        createdAt: Timestamp.fromDate(new Date('2026-03-01')),
        episodeDate: Timestamp.fromDate(new Date('2026-03-01')),
        intelligence: null,
        isVisible: true,
        links: {},
        posterUrl: null,
        title: 'New Episode',
      };
      const posterFile = new File(['img'], 'poster.png', { type: 'image/png' });

      await store.createEpisode(newEpisode, [], [], [], posterFile);

      expect(mockEpisodeService.createEpisode).toHaveBeenCalledWith(
        newEpisode,
        [],
        [],
        [],
        posterFile
      );
    });

    it('should set error on failure', async () => {
      mockEpisodeService.createEpisode.mockRejectedValueOnce(new Error('Create failed'));

      const newEpisode: Omit<Episode, 'id'> = {
        createdAt: Timestamp.fromDate(new Date('2026-03-01')),
        episodeDate: Timestamp.fromDate(new Date('2026-03-01')),
        intelligence: null,
        isVisible: true,
        links: {},
        posterUrl: null,
        title: 'New Episode',
      };

      await store.createEpisode(newEpisode, [], [], []);

      expect(store.error()).toBe('Create failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('updateEpisode', () => {
    it('should update episode and reload all episodes', async () => {
      await store.updateEpisode('ep1', { title: 'Updated Title' }, ['c1'], ['g1'], ['t1']);

      expect(mockEpisodeService.updateEpisode).toHaveBeenCalledWith(
        'ep1',
        { title: 'Updated Title' },
        ['c1'],
        ['g1'],
        ['t1'],
        undefined,
        undefined
      );
      expect(mockEpisodeService.getAllEpisodes).toHaveBeenCalled();
      expect(store.episodes()).toEqual(mockEpisodes);
      expect(store.loading()).toBe(false);
    });

    it('should pass poster file when provided', async () => {
      const posterFile = new File(['img'], 'poster.png', { type: 'image/png' });

      await store.updateEpisode('ep1', { title: 'Updated' }, undefined, undefined, undefined, posterFile);

      expect(mockEpisodeService.updateEpisode).toHaveBeenCalledWith(
        'ep1',
        { title: 'Updated' },
        undefined,
        undefined,
        undefined,
        posterFile,
        undefined
      );
    });

    it('should set error on failure', async () => {
      mockEpisodeService.updateEpisode.mockRejectedValueOnce(new Error('Update failed'));

      await store.updateEpisode('ep1', { title: 'Fail' });

      expect(store.error()).toBe('Update failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('deleteEpisode', () => {
    it('should delete episode and reload all episodes', async () => {
      await store.deleteEpisode('ep1');

      expect(mockEpisodeService.deleteEpisode).toHaveBeenCalledWith('ep1');
      expect(mockEpisodeService.getAllEpisodes).toHaveBeenCalled();
      expect(store.episodes()).toEqual(mockEpisodes);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockEpisodeService.deleteEpisode.mockRejectedValueOnce(new Error('Delete failed'));

      await store.deleteEpisode('ep1');

      expect(store.error()).toBe('Delete failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('clearSelectedEpisode', () => {
    it('should set selectedEpisode to null', async () => {
      // First load an episode so selectedEpisode is set
      await store.loadEpisodeById('ep1');
      expect(store.selectedEpisode()).not.toBeNull();

      store.clearSelectedEpisode();

      expect(store.selectedEpisode()).toBeNull();
    });

    it('should cancel an in-flight loadEpisodeById so its result is discarded', async () => {
      let resolve!: (v: EpisodeWithRelations) => void;
      const pending = new Promise<EpisodeWithRelations>((r) => (resolve = r));
      mockEpisodeService.getEpisodeById.mockImplementationOnce(() => pending);

      const inFlight = store.loadEpisodeById('ep1');
      store.clearSelectedEpisode();
      expect(store.selectedEpisode()).toBeNull();

      resolve(mockEpisodeWithRelations);
      await inFlight;

      expect(store.selectedEpisode()).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should set loading=true while loadEpisodes is pending', async () => {
      let resolve!: (v: Episode[]) => void;
      mockEpisodeService.getAllEpisodes.mockImplementationOnce(
        () => new Promise<Episode[]>((r) => (resolve = r))
      );

      const pending = store.loadEpisodes();
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();

      resolve(mockEpisodes);
      await pending;
      expect(store.loading()).toBe(false);
    });

    it('should clear a previous error when a subsequent call begins', async () => {
      mockEpisodeService.getAllEpisodes.mockRejectedValueOnce(new Error('boom'));
      await store.loadEpisodes();
      expect(store.error()).toBe('boom');

      let resolve!: (v: Episode[]) => void;
      mockEpisodeService.getAllEpisodes.mockImplementationOnce(
        () => new Promise<Episode[]>((r) => (resolve = r))
      );
      const pending = store.loadEpisodes();
      expect(store.error()).toBeNull();

      resolve(mockEpisodes);
      await pending;
    });
  });

  describe('loadVisibleEpisodes edge cases', () => {
    it('should pass empty string through to the service verbatim', async () => {
      await store.loadVisibleEpisodes('');
      expect(mockEpisodeService.getVisibleEpisodes).toHaveBeenCalledWith('');
    });
  });

  describe('updateEpisode edge cases', () => {
    it('should pass removePoster=true through to the service', async () => {
      await store.updateEpisode(
        'ep1',
        { title: 'Updated' },
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );

      expect(mockEpisodeService.updateEpisode).toHaveBeenCalledWith(
        'ep1',
        { title: 'Updated' },
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );
    });

    it('should accept empty relation arrays', async () => {
      await store.updateEpisode('ep1', { title: 'Updated' }, [], [], []);

      expect(mockEpisodeService.updateEpisode).toHaveBeenCalledWith(
        'ep1',
        { title: 'Updated' },
        [],
        [],
        [],
        undefined,
        undefined
      );
    });
  });
});
