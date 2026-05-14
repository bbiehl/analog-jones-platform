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
    getShelves: vi.fn(),
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
    mockService.getShelves.mockResolvedValue({
      episodesByCategory: Promise.resolve({}),
      episodesByGenre: {},
    });
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
    mockService.getShelves.mockResolvedValue({
      episodesByGenre: grouped,
      episodesByCategory: Promise.resolve(categorized),
    });

    await store.load();

    expect(mockService.getShelves).toHaveBeenCalled();
    expect(store.episodesByGenre()).toEqual(grouped);
    expect(store.episodesByCategory()).toEqual(categorized);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should set isLoading during the call and clear it on success', async () => {
    let loadingDuringCall: boolean | null = null;
    mockService.getShelves.mockImplementation(() => {
      loadingDuringCall = store.isLoading();
      return Promise.resolve({
        episodesByCategory: Promise.resolve({}),
        episodesByGenre: {},
      });
    });

    await store.load();

    expect(loadingDuringCall).toBe(true);
    expect(store.isLoading()).toBe(false);
  });

  it('should set error and clear isLoading on Error failure', async () => {
    mockService.getShelves.mockRejectedValue(new Error('Network error'));

    await store.load();

    expect(store.error()).toBe('Network error');
    expect(store.isLoading()).toBe(false);
    expect(store.episodesByGenre()).toEqual({});
    expect(store.episodesByCategory()).toEqual({});
  });

  it('should set a fallback message when a non-Error is thrown', async () => {
    mockService.getShelves.mockRejectedValue('nope');

    await store.load();

    expect(store.error()).toBe('Failed to load episodes');
    expect(store.isLoading()).toBe(false);
  });

  it('clears isLoading after genre shelves arrive, before category shelves resolve', async () => {
    const grouped = { Rock: [ep('a', 100)] };
    let resolveCategories!: (value: Record<string, Episode[]>) => void;
    const categoryPromise = new Promise<Record<string, Episode[]>>((resolve) => {
      resolveCategories = resolve;
    });
    mockService.getShelves.mockResolvedValue({
      episodesByGenre: grouped,
      episodesByCategory: categoryPromise,
    });

    const loadPromise = store.load();
    await Promise.resolve();
    await Promise.resolve();

    expect(store.isLoading()).toBe(false);
    expect(store.episodesByGenre()).toEqual(grouped);
    expect(store.episodesByCategory()).toEqual({});

    resolveCategories({ 'Nerd News': [ep('c', 300)] });
    await loadPromise;

    expect(store.episodesByCategory()).toEqual({ 'Nerd News': [ep('c', 300)] });
  });

  it('keeps genre shelves and no error when the category branch rejects', async () => {
    const grouped = { Rock: [ep('a', 100)] };
    mockService.getShelves.mockResolvedValue({
      episodesByGenre: grouped,
      episodesByCategory: Promise.reject(new Error('category boom')),
    });

    await store.load();

    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.episodesByGenre()).toEqual(grouped);
    expect(store.episodesByCategory()).toEqual({});
  });

  it('should clear a prior error when a subsequent load succeeds', async () => {
    mockService.getShelves.mockRejectedValueOnce(new Error('boom'));
    await store.load();
    expect(store.error()).toBe('boom');

    mockService.getShelves.mockResolvedValueOnce({
      episodesByGenre: { Rock: [ep('a', 100)] },
      episodesByCategory: Promise.resolve({}),
    });
    await store.load();

    expect(store.error()).toBeNull();
    expect(store.episodesByGenre()).toEqual({ Rock: [ep('a', 100)] });
  });
});
