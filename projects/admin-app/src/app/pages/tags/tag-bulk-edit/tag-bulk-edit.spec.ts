/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TagStore } from '../../../../../../../libs/tag/tag.store';
import { EpisodeStore } from '../../../../../../../libs/episode/episode.store';
import { EpisodeTagService } from '../../../../../../../libs/shared/episode-tag.service';
import { TagBulkEdit } from './tag-bulk-edit';

describe('TagBulkEdit', () => {
  let component: TagBulkEdit;
  let fixture: ComponentFixture<TagBulkEdit>;
  let mockEpisodeTagService: {
    getEpisodeIdsByTagId: ReturnType<typeof vi.fn>;
    setEpisodesForTag: ReturnType<typeof vi.fn>;
  };
  let mockTagStore: {
    selectedTag: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    loadTagById: ReturnType<typeof vi.fn>;
  };
  let mockEpisodeStore: {
    episodes: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    loadEpisodes: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const episodes = [
    { id: 'e1', title: 'First', isVisible: true },
    { id: 'e2', title: 'Second', isVisible: false },
    { id: 'e3', title: 'Third', isVisible: true },
  ];

  beforeEach(async () => {
    mockEpisodeTagService = {
      getEpisodeIdsByTagId: vi.fn().mockResolvedValue(['e1', 'e2']),
      setEpisodesForTag: vi.fn().mockResolvedValue(undefined),
    };
    mockTagStore = {
      selectedTag: signal({ id: 't1', name: 'Vintage', slug: 'vintage', episodes: [] }),
      loading: signal(false),
      error: signal(null),
      loadTagById: vi.fn().mockResolvedValue(undefined),
    };
    mockEpisodeStore = {
      episodes: signal(episodes),
      loading: signal(false),
      error: signal(null),
      loadEpisodes: vi.fn().mockResolvedValue(undefined),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [TagBulkEdit],
      providers: [
        { provide: EpisodeTagService, useValue: mockEpisodeTagService },
        { provide: TagStore, useValue: mockTagStore },
        { provide: EpisodeStore, useValue: mockEpisodeStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 't1' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TagBulkEdit);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should seed initial selection from getEpisodeIdsByTagId', () => {
    expect(mockEpisodeTagService.getEpisodeIdsByTagId).toHaveBeenCalledWith('t1');
    expect(component['selected']()).toEqual(new Set(['e1', 'e2']));
    expect(component['isDirty']()).toBe(false);
  });

  it('toggleEpisode should add and remove ids', () => {
    component['toggleEpisode']('e3');
    expect(component['selected']().has('e3')).toBe(true);
    expect(component['isDirty']()).toBe(true);

    component['toggleEpisode']('e3');
    expect(component['selected']().has('e3')).toBe(false);
    expect(component['isDirty']()).toBe(false);
  });

  it('toggleAll should select all then clear', () => {
    component['toggleAll']();
    expect(component['selected']()).toEqual(new Set(['e1', 'e2', 'e3']));
    component['toggleAll']();
    expect(component['selected']().size).toBe(0);
  });

  it('onSave should call setEpisodesForTag and navigate', async () => {
    component['toggleEpisode']('e3');
    await component['onSave']();

    expect(mockEpisodeTagService.setEpisodesForTag).toHaveBeenCalledWith(
      't1',
      expect.arrayContaining(['e1', 'e2', 'e3'])
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tags']);
  });

  it('onSave should noop when not dirty', async () => {
    await component['onSave']();
    expect(mockEpisodeTagService.setEpisodesForTag).not.toHaveBeenCalled();
  });

  it('onCancel should navigate back', () => {
    component['onCancel']();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tags']);
  });
});
