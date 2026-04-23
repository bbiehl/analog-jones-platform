import { TestBed } from '@angular/core/testing';
import { RelatedEpisodeStore } from './related-episode.store';
import { RelatedEpisodesService } from './related-episodes.service';

describe('RelatedEpisodeStore', () => {
  let store: InstanceType<typeof RelatedEpisodeStore>;

  const mockService = {
    getRelatedEpisodes: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RelatedEpisodeStore,
        { provide: RelatedEpisodesService, useValue: mockService },
      ],
    });
    store = TestBed.inject(RelatedEpisodeStore);
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    expect(store.relatedEpisodes()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
