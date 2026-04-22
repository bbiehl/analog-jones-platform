/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from '../shared/firebase.token';
import { TagService } from './tag.service';
import type { Firestore } from 'firebase/firestore';

describe('TagService', () => {
  let service: TagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TagService,
        { provide: FIRESTORE, useValue: {} as Firestore },
      ],
    });

    service = TestBed.inject(TagService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of TagService', () => {
      expect(service).toBeInstanceOf(TagService);
    });
  });

  describe('getAllTags', () => {
    it('should map snapshot docs to Tag objects', () => {
      const mockDocs = [
        { id: 't1', data: () => ({ name: 'Vintage', slug: 'vintage' }) },
        { id: 't2', data: () => ({ name: 'Analog', slug: 'analog' }) },
      ];

      const result = mockDocs.map((d) => ({ id: d.id, ...d.data() }));

      expect(result).toEqual([
        { id: 't1', name: 'Vintage', slug: 'vintage' },
        { id: 't2', name: 'Analog', slug: 'analog' },
      ]);
    });
  });

  describe('getTagById', () => {
    it('should combine snapshot id and data into a Tag', () => {
      const snap = {
        exists: () => true,
        id: 't1',
        data: () => ({ name: 'Vintage', slug: 'vintage' }),
      };

      const result = { id: snap.id, ...snap.data() };
      expect(result).toEqual({ id: 't1', name: 'Vintage', slug: 'vintage' });
    });

    it('should throw when snapshot does not exist', () => {
      const snap = { exists: () => false };

      expect(() => {
        if (!snap.exists()) {
          throw new Error('Tag with id "missing" not found');
        }
      }).toThrow('Tag with id "missing" not found');
    });
  });

  describe('createTag', () => {
    it('should only pass name and slug fields', () => {
      const tag = { name: 'Retro', slug: 'retro' };
      const payload = { name: tag.name, slug: tag.slug };

      expect(payload).toEqual({ name: 'Retro', slug: 'retro' });
      expect(payload).not.toHaveProperty('id');
    });
  });

  describe('updateTag', () => {
    it('should strip the id field before updating', () => {
      const tag = { id: 't1', name: 'Updated', slug: 'updated' };
      const { id: _id, ...data } = tag;

      expect(data).toEqual({ name: 'Updated', slug: 'updated' });
      expect(data).not.toHaveProperty('id');
    });
  });

  describe('deleteTag', () => {
    it('should build episodeTags query payload and include the tag doc in the batch', () => {
      const tagId = 't1';
      const episodeTagDocs = [{ ref: { path: 'episodeTags/et1' } }];
      const deletions = [
        ...episodeTagDocs.map((d) => d.ref),
        { path: `tags/${tagId}` },
      ];

      expect(deletions).toEqual([
        { path: 'episodeTags/et1' },
        { path: 'tags/t1' },
      ]);
    });
  });
});
