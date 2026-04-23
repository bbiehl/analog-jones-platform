/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { GenreStore } from './genre.store';
import { GenreService } from './genre.service';
import { Genre } from './genre.model';

describe('GenreStore', () => {
  let store: InstanceType<typeof GenreStore>;

  const mockGenres: Genre[] = [
    { id: '1', name: 'Jazz', slug: 'jazz' },
    { id: '2', name: 'Rock', slug: 'rock' },
  ];

  const mockGenreService = {
    getAllGenres: vi.fn().mockResolvedValue(mockGenres),
    getGenreById: vi.fn().mockResolvedValue(mockGenres[0]),
    createGenre: vi.fn().mockResolvedValue('new-id'),
    updateGenre: vi.fn().mockResolvedValue(undefined),
    deleteGenre: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GenreStore, { provide: GenreService, useValue: mockGenreService }],
    });
    store = TestBed.inject(GenreStore);
    vi.clearAllMocks();
    mockGenreService.getAllGenres.mockResolvedValue(mockGenres);
    mockGenreService.getGenreById.mockResolvedValue(mockGenres[0]);
    mockGenreService.createGenre.mockResolvedValue('new-id');
    mockGenreService.updateGenre.mockResolvedValue(undefined);
    mockGenreService.deleteGenre.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have empty genres', () => {
      expect(store.genres()).toEqual([]);
    });

    it('should have null selectedGenre', () => {
      expect(store.selectedGenre()).toBeNull();
    });

    it('should have loading false', () => {
      expect(store.loading()).toBe(false);
    });

    it('should have null error', () => {
      expect(store.error()).toBeNull();
    });
  });

  describe('loadGenres', () => {
    it('should load genres from service', async () => {
      await store.loadGenres();

      expect(mockGenreService.getAllGenres).toHaveBeenCalled();
      expect(store.genres()).toEqual(mockGenres);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should set error on failure', async () => {
      mockGenreService.getAllGenres.mockRejectedValueOnce(new Error('Network error'));

      await store.loadGenres();

      expect(store.error()).toBe('Network error');
      expect(store.loading()).toBe(false);
      expect(store.genres()).toEqual([]);
    });
  });

  describe('loadGenreById', () => {
    it('should load genre and set selectedGenre with empty episodes', async () => {
      await store.loadGenreById('1');

      expect(mockGenreService.getGenreById).toHaveBeenCalledWith('1');
      expect(store.selectedGenre()).toEqual({
        ...mockGenres[0],
        episodes: [],
      });
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockGenreService.getGenreById.mockRejectedValueOnce(
        new Error('Genre with id "missing" not found')
      );

      await store.loadGenreById('missing');

      expect(store.error()).toBe('Genre with id "missing" not found');
      expect(store.loading()).toBe(false);
      expect(store.selectedGenre()).toBeNull();
    });
  });

  describe('createGenre', () => {
    it('should create genre and reload all genres', async () => {
      const newGenre: Omit<Genre, 'id'> = { name: 'Blues', slug: 'blues' };

      await store.createGenre(newGenre);

      expect(mockGenreService.createGenre).toHaveBeenCalledWith(newGenre);
      expect(mockGenreService.getAllGenres).toHaveBeenCalled();
      expect(store.genres()).toEqual(mockGenres);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockGenreService.createGenre.mockRejectedValueOnce(new Error('Create failed'));

      await store.createGenre({ name: 'Fail', slug: 'fail' });

      expect(store.error()).toBe('Create failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('updateGenre', () => {
    it('should update genre and reload all genres', async () => {
      await store.updateGenre('1', { name: 'Updated Jazz' });

      expect(mockGenreService.updateGenre).toHaveBeenCalledWith('1', { name: 'Updated Jazz' });
      expect(mockGenreService.getAllGenres).toHaveBeenCalled();
      expect(store.genres()).toEqual(mockGenres);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockGenreService.updateGenre.mockRejectedValueOnce(new Error('Update failed'));

      await store.updateGenre('1', { name: 'Fail' });

      expect(store.error()).toBe('Update failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('deleteGenre', () => {
    it('should delete genre and reload all genres', async () => {
      await store.deleteGenre('1');

      expect(mockGenreService.deleteGenre).toHaveBeenCalledWith('1');
      expect(mockGenreService.getAllGenres).toHaveBeenCalled();
      expect(store.genres()).toEqual(mockGenres);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockGenreService.deleteGenre.mockRejectedValueOnce(new Error('Delete failed'));

      await store.deleteGenre('1');

      expect(store.error()).toBe('Delete failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('clearSelectedGenre', () => {
    it('should set selectedGenre to null', async () => {
      await store.loadGenreById('1');
      expect(store.selectedGenre()).not.toBeNull();

      store.clearSelectedGenre();

      expect(store.selectedGenre()).toBeNull();
    });
  });
});
