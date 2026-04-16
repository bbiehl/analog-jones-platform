/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { TagStore } from './tag.store';
import { TagService } from './tag.service';
import { Tag, TagWithRelations } from './tag.model';

describe('TagStore', () => {
  let store: InstanceType<typeof TagStore>;

  const mockTags: Tag[] = [
    { id: '1', name: 'Vinyl', slug: 'vinyl' },
    { id: '2', name: 'Jazz', slug: 'jazz' },
  ];

  const mockTagWithRelations: TagWithRelations = {
    id: '1',
    name: 'Vinyl',
    slug: 'vinyl',
    episodes: [],
  };

  const mockTagService = {
    getAllTags: vi.fn().mockResolvedValue(mockTags),
    getTagById: vi.fn().mockResolvedValue(mockTags[0]),
    getTagBySlug: vi.fn().mockResolvedValue(mockTagWithRelations),
    createTag: vi.fn().mockResolvedValue('new-id'),
    updateTag: vi.fn().mockResolvedValue(undefined),
    deleteTag: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TagStore, { provide: TagService, useValue: mockTagService }],
    });
    store = TestBed.inject(TagStore);
    vi.clearAllMocks();
    // Re-set default resolved values after clearAllMocks
    mockTagService.getAllTags.mockResolvedValue(mockTags);
    mockTagService.getTagById.mockResolvedValue(mockTags[0]);
    mockTagService.getTagBySlug.mockResolvedValue(mockTagWithRelations);
    mockTagService.createTag.mockResolvedValue('new-id');
    mockTagService.updateTag.mockResolvedValue(undefined);
    mockTagService.deleteTag.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have empty tags', () => {
      expect(store.tags()).toEqual([]);
    });

    it('should have null selectedTag', () => {
      expect(store.selectedTag()).toBeNull();
    });

    it('should have loading false', () => {
      expect(store.loading()).toBe(false);
    });

    it('should have null error', () => {
      expect(store.error()).toBeNull();
    });
  });

  describe('loadTags', () => {
    it('should load tags from service', async () => {
      await store.loadTags();

      expect(mockTagService.getAllTags).toHaveBeenCalled();
      expect(store.tags()).toEqual(mockTags);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should set error on failure', async () => {
      mockTagService.getAllTags.mockRejectedValueOnce(new Error('Network error'));

      await store.loadTags();

      expect(store.error()).toBe('Network error');
      expect(store.loading()).toBe(false);
      expect(store.tags()).toEqual([]);
    });
  });

  describe('loadTagById', () => {
    it('should load tag and set selectedTag with empty episodes', async () => {
      await store.loadTagById('1');

      expect(mockTagService.getTagById).toHaveBeenCalledWith('1');
      expect(store.selectedTag()).toEqual({
        ...mockTags[0],
        episodes: [],
      });
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockTagService.getTagById.mockRejectedValueOnce(
        new Error('Tag with id "missing" not found')
      );

      await store.loadTagById('missing');

      expect(store.error()).toBe('Tag with id "missing" not found');
      expect(store.loading()).toBe(false);
      expect(store.selectedTag()).toBeNull();
    });
  });

  describe('loadTagBySlug', () => {
    it('should load tag by slug and set selectedTag', async () => {
      await store.loadTagBySlug('vinyl');

      expect(mockTagService.getTagBySlug).toHaveBeenCalledWith('vinyl');
      expect(store.selectedTag()).toEqual(mockTagWithRelations);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockTagService.getTagBySlug.mockRejectedValueOnce(
        new Error('Tag with slug "unknown" not found')
      );

      await store.loadTagBySlug('unknown');

      expect(store.error()).toBe('Tag with slug "unknown" not found');
      expect(store.loading()).toBe(false);
    });
  });

  describe('createTag', () => {
    it('should create tag and reload all tags', async () => {
      const newTag: Omit<Tag, 'id'> = { name: 'Hip-Hop', slug: 'hip-hop' };

      await store.createTag(newTag);

      expect(mockTagService.createTag).toHaveBeenCalledWith(newTag);
      expect(mockTagService.getAllTags).toHaveBeenCalled();
      expect(store.tags()).toEqual(mockTags);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockTagService.createTag.mockRejectedValueOnce(new Error('Create failed'));

      await store.createTag({ name: 'Fail', slug: 'fail' });

      expect(store.error()).toBe('Create failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('updateTag', () => {
    it('should update tag and reload all tags', async () => {
      await store.updateTag('1', { name: 'Updated Vinyl' });

      expect(mockTagService.updateTag).toHaveBeenCalledWith('1', { name: 'Updated Vinyl' });
      expect(mockTagService.getAllTags).toHaveBeenCalled();
      expect(store.tags()).toEqual(mockTags);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockTagService.updateTag.mockRejectedValueOnce(new Error('Update failed'));

      await store.updateTag('1', { name: 'Fail' });

      expect(store.error()).toBe('Update failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('deleteTag', () => {
    it('should delete tag and reload all tags', async () => {
      await store.deleteTag('1');

      expect(mockTagService.deleteTag).toHaveBeenCalledWith('1');
      expect(mockTagService.getAllTags).toHaveBeenCalled();
      expect(store.tags()).toEqual(mockTags);
      expect(store.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      mockTagService.deleteTag.mockRejectedValueOnce(new Error('Delete failed'));

      await store.deleteTag('1');

      expect(store.error()).toBe('Delete failed');
      expect(store.loading()).toBe(false);
    });
  });

  describe('clearSelectedTag', () => {
    it('should set selectedTag to null', async () => {
      // First load a tag so selectedTag is set
      await store.loadTagBySlug('vinyl');
      expect(store.selectedTag()).not.toBeNull();

      store.clearSelectedTag();

      expect(store.selectedTag()).toBeNull();
    });
  });
});
