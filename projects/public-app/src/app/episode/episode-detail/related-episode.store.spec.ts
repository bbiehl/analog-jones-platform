import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { Episode, EpisodeWithRelations } from '../../../../../../libs/episode/episode.model';
import { RelatedEpisodeStore } from './related-episode.store';
import { RelatedEpisodesService } from './related-episodes.service';

describe('RelatedEpisodeStore', () => {
  let store: InstanceType<typeof RelatedEpisodeStore>;

  const episode: EpisodeWithRelations = {
    id: 'ep-source',
    createdAt: Timestamp.fromMillis(0),
    episodeDate: Timestamp.fromMillis(0),
    intelligence: null,
    isVisible: true,
    links: {},
    posterUrl: null,
    title: 'Source',
    categories: [],
    genres: [],
    tags: [],
  };

  const mockRelated: Episode[] = [
    {
      id: 'ep1',
      createdAt: Timestamp.fromMillis(0),
      episodeDate: Timestamp.fromMillis(1_000),
      intelligence: null,
      isVisible: true,
      links: {},
      posterUrl: null,
      title: 'Related 1',
    },
  ];

  const mockService = {
    getRelatedEpisodes: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getRelatedEpisodes.mockResolvedValue(mockRelated);

    TestBed.configureTestingModule({
      providers: [
        RelatedEpisodeStore,
        { provide: RelatedEpisodesService, useValue: mockService },
      ],
    });
    store = TestBed.inject(RelatedEpisodeStore);
  });

  it('should have correct initial state', () => {
    expect(store.relatedEpisodes()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('loadRelatedEpisodes', () => {
    it('should populate relatedEpisodes on success and pass the episode to the service', async () => {
      await store.loadRelatedEpisodes(episode);

      expect(mockService.getRelatedEpisodes).toHaveBeenCalledWith(episode);
      expect(store.relatedEpisodes()).toEqual(mockRelated);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should set loading true during the request and reset it after', async () => {
      let loadingDuringCall: boolean | undefined;
      mockService.getRelatedEpisodes.mockImplementationOnce(async () => {
        loadingDuringCall = store.loading();
        return mockRelated;
      });

      await store.loadRelatedEpisodes(episode);

      expect(loadingDuringCall).toBe(true);
      expect(store.loading()).toBe(false);
    });

    it('should clear a prior error when a new load starts', async () => {
      mockService.getRelatedEpisodes.mockRejectedValueOnce(new Error('boom'));
      await store.loadRelatedEpisodes(episode);
      expect(store.error()).toBe('boom');

      mockService.getRelatedEpisodes.mockResolvedValueOnce(mockRelated);
      await store.loadRelatedEpisodes(episode);

      expect(store.error()).toBeNull();
      expect(store.relatedEpisodes()).toEqual(mockRelated);
    });

    it('should set error and reset loading when the service throws', async () => {
      mockService.getRelatedEpisodes.mockRejectedValueOnce(new Error('Network error'));

      await store.loadRelatedEpisodes(episode);

      expect(store.error()).toBe('Network error');
      expect(store.loading()).toBe(false);
      expect(store.relatedEpisodes()).toEqual([]);
    });
  });

  describe('clearRelatedEpisodes', () => {
    it('should empty relatedEpisodes', async () => {
      await store.loadRelatedEpisodes(episode);
      expect(store.relatedEpisodes()).toEqual(mockRelated);

      store.clearRelatedEpisodes();

      expect(store.relatedEpisodes()).toEqual([]);
    });

    it('should leave error and loading untouched', async () => {
      mockService.getRelatedEpisodes.mockRejectedValueOnce(new Error('oops'));
      await store.loadRelatedEpisodes(episode);

      store.clearRelatedEpisodes();

      expect(store.error()).toBe('oops');
      expect(store.loading()).toBe(false);
    });
  });
});
