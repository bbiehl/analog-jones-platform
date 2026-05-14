/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';

import { EpisodeListStore } from './episode-list.store';
import { EpisodeListService } from './episode-list.service';
import type { Episode } from '@aj/core';

function ep(id: string, millis: number): Episode {
  return {
    id,
    createdAt: Timestamp.fromMillis(0),
    episodeDate: Timestamp.fromMillis(millis),
    intelligence: null,
    isVisible: true,
    links: {},
    posterUrl: null,
    title: id,
  };
}

describe('EpisodeListStore', () => {
  let store: InstanceType<typeof EpisodeListStore>;
  const mockService = {
    getEpisodesByGenre: vi.fn(),
    getEpisodesByFeaturedCategory: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EpisodeListStore,
        { provide: EpisodeListService, useValue: mockService },
      ],
    });
    store = TestBed.inject(EpisodeListStore);
    vi.clearAllMocks();
    mockService.getEpisodesByGenre.mockResolvedValue({});
    mockService.getEpisodesByFeaturedCategory.mockResolvedValue({});
  });

  it('should have correct initial state', () => {
    expect(store.episodesByCategory()).toEqual({});
    expect(store.episodesByGenre()).toEqual({});
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load episodes grouped by category and genre', async () => {
    const grouped = { Rock: [ep('a', 100)], Jazz: [ep('b', 200)] };
    const categorized = { 'Nerd News': [ep('c', 300)] };
    mockService.getEpisodesByGenre.mockResolvedValue(grouped);
    mockService.getEpisodesByFeaturedCategory.mockResolvedValue(categorized);

    await store.load();

    expect(mockService.getEpisodesByGenre).toHaveBeenCalled();
    expect(mockService.getEpisodesByFeaturedCategory).toHaveBeenCalled();
    expect(store.episodesByGenre()).toEqual(grouped);
    expect(store.episodesByCategory()).toEqual(categorized);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should set isLoading during the call and clear it on success', async () => {
    let loadingDuringCall: boolean | null = null;
    mockService.getEpisodesByGenre.mockImplementation(() => {
      loadingDuringCall = store.isLoading();
      return Promise.resolve({});
    });

    await store.load();

    expect(loadingDuringCall).toBe(true);
    expect(store.isLoading()).toBe(false);
  });

  it('should set error and clear isLoading on Error failure', async () => {
    mockService.getEpisodesByGenre.mockRejectedValue(new Error('Network error'));

    await store.load();

    expect(store.error()).toBe('Network error');
    expect(store.isLoading()).toBe(false);
    expect(store.episodesByGenre()).toEqual({});
    expect(store.episodesByCategory()).toEqual({});
  });

  it('should set a fallback message when a non-Error is thrown', async () => {
    mockService.getEpisodesByGenre.mockRejectedValue('nope');

    await store.load();

    expect(store.error()).toBe('Failed to load episodes');
    expect(store.isLoading()).toBe(false);
  });

  it('should clear a prior error when a subsequent load succeeds', async () => {
    mockService.getEpisodesByGenre.mockRejectedValueOnce(new Error('boom'));
    await store.load();
    expect(store.error()).toBe('boom');

    mockService.getEpisodesByGenre.mockResolvedValueOnce({ Rock: [ep('a', 100)] });
    await store.load();

    expect(store.error()).toBeNull();
    expect(store.episodesByGenre()).toEqual({ Rock: [ep('a', 100)] });
  });
});
