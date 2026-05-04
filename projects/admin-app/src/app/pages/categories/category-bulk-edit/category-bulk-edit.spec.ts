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
    fixture.detectChanges();
    await fixture.whenStable();
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

  describe('isChecked', () => {
    it('returns true for ids in the selected set', () => {
      expect(component['isChecked']('e1')).toBe(true);
    });

    it('returns false for ids not in the selected set', () => {
      expect(component['isChecked']('e3')).toBe(false);
    });

    it('returns false when episodeId is undefined', () => {
      expect(component['isChecked'](undefined)).toBe(false);
    });
  });

  describe('toggleEpisode edge cases', () => {
    it('does nothing when episodeId is undefined', () => {
      const before = new Set(component['selected']());
      component['toggleEpisode'](undefined);
      expect(component['selected']()).toEqual(before);
    });
  });

  describe('toggleAll edge cases', () => {
    it('skips episodes without an id when selecting all', () => {
      mockEpisodeStore.episodes.set([
        { id: 'e1', title: 'First', isVisible: true },
        { id: undefined, title: 'No id', isVisible: true },
        { id: 'e3', title: 'Third', isVisible: true },
      ]);
      component['selected'].set(new Set());

      component['toggleAll']();

      expect(component['selected']()).toEqual(new Set(['e1', 'e3']));
    });
  });

  describe('allSelected / someSelected', () => {
    it('allSelected is false when episodes list is empty', () => {
      mockEpisodeStore.episodes.set([]);
      component['selected'].set(new Set());
      expect(component['allSelected']()).toBe(false);
      expect(component['someSelected']()).toBe(false);
    });

    it('someSelected is true when a partial selection exists', () => {
      component['selected'].set(new Set(['e1']));
      expect(component['someSelected']()).toBe(true);
      expect(component['allSelected']()).toBe(false);
    });

    it('someSelected is false when all episodes are selected', () => {
      component['selected'].set(new Set(['e1', 'e2', 'e3']));
      expect(component['allSelected']()).toBe(true);
      expect(component['someSelected']()).toBe(false);
    });
  });

  describe('isDirty edge cases', () => {
    it('is true when sizes match but contents differ', () => {
      component['selected'].set(new Set(['e1', 'e3']));
      expect(component['isDirty']()).toBe(true);
    });
  });

  describe('onSave guards', () => {
    it('does not save when selectedCategory is null', async () => {
      mockCategoryStore.selectedCategory.set(null);
      component['toggleEpisode']('e3');

      await component['onSave']();

      expect(mockEpisodeCategoryService.setEpisodesForCategory).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('does not save when already saving', async () => {
      component['toggleEpisode']('e3');
      component['saving'].set(true);

      await component['onSave']();

      expect(mockEpisodeCategoryService.setEpisodesForCategory).not.toHaveBeenCalled();
    });

    it('resets saving back to false after a successful save', async () => {
      component['toggleEpisode']('e3');

      await component['onSave']();

      expect(component['saving']()).toBe(false);
    });

    it('resets saving back to false when setEpisodesForCategory rejects', async () => {
      mockEpisodeCategoryService.setEpisodesForCategory.mockRejectedValueOnce(
        new Error('boom')
      );
      component['toggleEpisode']('e3');

      await expect(component['onSave']()).rejects.toThrow('boom');
      expect(component['saving']()).toBe(false);
    });
  });

  describe('loadAssigned error path', () => {
    it('sets junctionError when getEpisodeIdsByCategoryId rejects', async () => {
      mockEpisodeCategoryService.getEpisodeIdsByCategoryId.mockRejectedValueOnce(
        new Error('network down')
      );

      const fresh = TestBed.createComponent(CategoryBulkEdit);
      fresh.detectChanges();
      await fresh.whenStable();

      expect(fresh.componentInstance['junctionError']()).toBe('network down');
      expect(fresh.componentInstance['loadingJunctions']()).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('renders the category name in the heading when selected', () => {
      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toContain('Music');
    });

    it('shows "Category not found." when selectedCategory is null and not loading', () => {
      mockCategoryStore.selectedCategory.set(null);
      component['loadingJunctions'].set(false);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Category not found.');
    });

    it('shows the junction error message when junctionError is set', () => {
      component['junctionError'].set('Failed to load assignments');
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Failed to load assignments');
    });

    it('shows the empty-state message when there are no episodes', () => {
      mockEpisodeStore.episodes.set([]);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No episodes yet.');
    });

    it('shows a loading spinner when loadingJunctions is true', () => {
      component['loadingJunctions'].set(true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('shows the categoryStore error when set', () => {
      mockCategoryStore.error.set('Boom from category store');
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Boom from category store');
    });

    it('shows the episodeStore error when set', () => {
      mockEpisodeStore.error.set('Boom from episode store');
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Boom from episode store');
    });

    it('shows the in-button save spinner when saving is true', () => {
      component['toggleEpisode']('e3');
      component['saving'].set(true);
      fixture.detectChanges();

      const buttonSpinner = fixture.nativeElement.querySelector(
        'button[mat-flat-button] mat-spinner'
      );
      expect(buttonSpinner).toBeTruthy();
    });

    it('renders the mat-table with a row per episode and respects selection state', () => {
      const tables = fixture.nativeElement.querySelectorAll('table');
      expect(tables.length).toBe(1);

      const dataRows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
      expect(dataRows.length).toBe(3);

      const titleCells = fixture.nativeElement.querySelectorAll(
        'tr.mat-mdc-row td.cdk-column-title'
      );
      const titles = Array.from(titleCells).map((c: any) => c.textContent.trim());
      expect(titles).toEqual(['First', 'Second', 'Third']);

      const visibleIcons = fixture.nativeElement.querySelectorAll(
        'tr.mat-mdc-row td.cdk-column-isVisible mat-icon'
      );
      expect(visibleIcons.length).toBe(3);
      expect(visibleIcons[0].textContent.trim()).toBe('visibility');
      expect(visibleIcons[1].textContent.trim()).toBe('visibility_off');
      expect(visibleIcons[2].textContent.trim()).toBe('visibility');
    });
  });
});
