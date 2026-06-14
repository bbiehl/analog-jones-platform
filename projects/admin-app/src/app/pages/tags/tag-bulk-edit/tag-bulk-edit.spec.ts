/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { TagService, TagStore } from '@aj/core';
import { EpisodeStore } from '@aj/core';
import { TagBulkEdit } from './tag-bulk-edit';

describe('TagBulkEdit', () => {
  let component: TagBulkEdit;
  let fixture: ComponentFixture<TagBulkEdit>;
  let mockTagService: { setEpisodesForTag: ReturnType<typeof vi.fn> };
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
  let loader: HarnessLoader;

  const tag = { id: 't1', name: 'Vintage', slug: 'vintage' };
  // e1 and e2 embed t1, so the initial selection should be {e1, e2}.
  const episodes = [
    { id: 'e1', title: 'First', isVisible: true, categories: [], genres: [], tags: [tag] },
    { id: 'e2', title: 'Second', isVisible: false, categories: [], genres: [], tags: [tag] },
    { id: 'e3', title: 'Third', isVisible: true, categories: [], genres: [], tags: [] },
  ];

  beforeEach(async () => {
    mockTagService = { setEpisodesForTag: vi.fn().mockResolvedValue(undefined) };
    mockTagStore = {
      selectedTag: signal(tag),
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
        { provide: TagService, useValue: mockTagService },
        { provide: TagStore, useValue: mockTagStore },
        { provide: EpisodeStore, useValue: mockEpisodeStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 't1' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TagBulkEdit);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should seed initial selection from episodes that embed the tag', () => {
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

    expect(mockTagService.setEpisodesForTag).toHaveBeenCalledWith(
      tag,
      expect.arrayContaining(['e1', 'e2', 'e3']),
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tags']);
  });

  it('onSave should noop when not dirty', async () => {
    await component['onSave']();
    expect(mockTagService.setEpisodesForTag).not.toHaveBeenCalled();
  });

  it('onCancel should navigate back', () => {
    component['onCancel']();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tags']);
  });

  it('isChecked returns false for undefined episode id', () => {
    expect(component['isChecked'](undefined)).toBe(false);
  });

  it('toggleEpisode noops when id is undefined', () => {
    const before = new Set(component['selected']());
    component['toggleEpisode'](undefined);
    expect(component['selected']()).toEqual(before);
  });

  it('allSelected/someSelected reflect selection state', () => {
    expect(component['allSelected']()).toBe(false);
    expect(component['someSelected']()).toBe(true);

    component['toggleAll'](); // select all
    expect(component['allSelected']()).toBe(true);
    expect(component['someSelected']()).toBe(false);

    component['toggleAll'](); // clear
    expect(component['allSelected']()).toBe(false);
    expect(component['someSelected']()).toBe(false);
  });

  it('allSelected is false when there are no episodes', () => {
    mockEpisodeStore.episodes.set([]);
    expect(component['allSelected']()).toBe(false);
  });

  it('onSave noops when there is no selectedTag', async () => {
    (mockTagStore.selectedTag as ReturnType<typeof signal<unknown>>).set(null);
    component['toggleEpisode']('e3');
    await component['onSave']();
    expect(mockTagService.setEpisodesForTag).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('onSave resets saving flag if setEpisodesForTag rejects', async () => {
    mockTagService.setEpisodesForTag.mockRejectedValueOnce(new Error('boom'));
    component['toggleEpisode']('e3');
    await expect(component['onSave']()).rejects.toThrow('boom');
    expect(component['saving']()).toBe(false);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  describe('template', () => {
    it('renders tag name in heading', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1.textContent).toContain('Vintage');
    });

    it('renders the episodes table with one row per episode', async () => {
      const table = await loader.getHarness(MatTableHarness);
      const rows = await table.getRows();
      expect(rows.length).toBe(3);
    });

    it('renders header checkbox in indeterminate state when partially selected', async () => {
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      const header = checkboxes[0];
      expect(await header.isIndeterminate()).toBe(true);
      expect(await header.isChecked()).toBe(false);
    });

    it('shows spinner while loading episodes', async () => {
      mockEpisodeStore.loading.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });

    it('shows tag store error when set', async () => {
      mockTagStore.error.set('tag boom');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('tag boom');
    });

    it('shows "Tag not found." when selectedTag is null', async () => {
      (mockTagStore.selectedTag as ReturnType<typeof signal<unknown>>).set(null);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('Tag not found.');
    });

    it('shows episode store error', async () => {
      mockEpisodeStore.error.set('ep boom');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('ep boom');
    });

    it('shows empty state when there are no episodes', async () => {
      mockEpisodeStore.episodes.set([]);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('No episodes yet');
    });
  });
});
