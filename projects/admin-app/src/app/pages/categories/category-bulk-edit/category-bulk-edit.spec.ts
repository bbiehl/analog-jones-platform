/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryStore } from '../../../../../../../libs/category/category.store';
import { EpisodeStore } from '../../../../../../../libs/episode/episode.store';
import { EpisodeCategoryService } from '../../../../../../../libs/shared/episode-category.service';
import { CategoryBulkEdit } from './category-bulk-edit';

describe('CategoryBulkEdit', () => {
  let component: CategoryBulkEdit;
  let fixture: ComponentFixture<CategoryBulkEdit>;
  let mockEpisodeCategoryService: {
    getEpisodeIdsByCategoryId: ReturnType<typeof vi.fn>;
    setEpisodesForCategory: ReturnType<typeof vi.fn>;
  };
  let mockCategoryStore: {
    selectedCategory: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    loadCategoryById: ReturnType<typeof vi.fn>;
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
    mockEpisodeCategoryService = {
      getEpisodeIdsByCategoryId: vi.fn().mockResolvedValue(['e1', 'e2']),
      setEpisodesForCategory: vi.fn().mockResolvedValue(undefined),
    };
    mockCategoryStore = {
      selectedCategory: signal({ id: 'cat1', name: 'Music', slug: 'music', episodes: [] }),
      loading: signal(false),
      error: signal(null),
      loadCategoryById: vi.fn().mockResolvedValue(undefined),
    };
    mockEpisodeStore = {
      episodes: signal(episodes),
      loading: signal(false),
      error: signal(null),
      loadEpisodes: vi.fn().mockResolvedValue(undefined),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CategoryBulkEdit],
      providers: [
        { provide: EpisodeCategoryService, useValue: mockEpisodeCategoryService },
        { provide: CategoryStore, useValue: mockCategoryStore },
        { provide: EpisodeStore, useValue: mockEpisodeStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'cat1' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBulkEdit);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should seed initial selection from getEpisodeIdsByCategoryId', () => {
    expect(mockEpisodeCategoryService.getEpisodeIdsByCategoryId).toHaveBeenCalledWith('cat1');
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

  it('toggleEpisode should remove an initially-assigned id', () => {
    component['toggleEpisode']('e1');
    expect(component['selected']().has('e1')).toBe(false);
    expect(component['isDirty']()).toBe(true);
  });

  it('toggleAll should select all episode ids when not all selected', () => {
    component['toggleAll']();
    expect(component['selected']()).toEqual(new Set(['e1', 'e2', 'e3']));
    expect(component['allSelected']()).toBe(true);
  });

  it('toggleAll should clear selection when all are selected', () => {
    component['toggleAll']();
    component['toggleAll']();
    expect(component['selected']().size).toBe(0);
  });

  it('onSave should call setEpisodesForCategory with current selection and navigate', async () => {
    component['toggleEpisode']('e3');
    await component['onSave']();

    expect(mockEpisodeCategoryService.setEpisodesForCategory).toHaveBeenCalledWith(
      'cat1',
      expect.arrayContaining(['e1', 'e2', 'e3'])
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories']);
  });

  it('onSave should noop when not dirty', async () => {
    await component['onSave']();
    expect(mockEpisodeCategoryService.setEpisodesForCategory).not.toHaveBeenCalled();
  });

  it('onCancel should navigate back to categories', () => {
    component['onCancel']();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories']);
  });
});
