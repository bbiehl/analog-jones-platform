/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { GenreStore } from '@aj/core';
import { EpisodeStore } from '@aj/core';
import { EpisodeGenreService } from '@aj/core';
import { GenreBulkEdit } from './genre-bulk-edit';

describe('GenreBulkEdit', () => {
  let component: GenreBulkEdit;
  let fixture: ComponentFixture<GenreBulkEdit>;
  let mockEpisodeGenreService: {
    getEpisodeIdsByGenreId: ReturnType<typeof vi.fn>;
    setEpisodesForGenre: ReturnType<typeof vi.fn>;
  };
  let mockGenreStore: {
    selectedGenre: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    loadGenreById: ReturnType<typeof vi.fn>;
  };
  let mockEpisodeStore: {
    episodes: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    loadEpisodes: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let loader: HarnessLoader;

  const episodes = [
    { id: 'e1', title: 'First', isVisible: true },
    { id: 'e2', title: 'Second', isVisible: false },
    { id: 'e3', title: 'Third', isVisible: true },
  ];

  beforeEach(async () => {
    mockEpisodeGenreService = {
      getEpisodeIdsByGenreId: vi.fn().mockResolvedValue(['e1', 'e2']),
      setEpisodesForGenre: vi.fn().mockResolvedValue(undefined),
    };
    mockGenreStore = {
      selectedGenre: signal({ id: 'g1', name: 'Rock', slug: 'rock', episodes: [] }),
      loading: signal(false),
      error: signal(null),
      loadGenreById: vi.fn().mockResolvedValue(undefined),
    };
    mockEpisodeStore = {
      episodes: signal(episodes),
      loading: signal(false),
      error: signal(null),
      loadEpisodes: vi.fn().mockResolvedValue(undefined),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GenreBulkEdit],
      providers: [
        { provide: EpisodeGenreService, useValue: mockEpisodeGenreService },
        { provide: GenreStore, useValue: mockGenreStore },
        { provide: EpisodeStore, useValue: mockEpisodeStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'g1' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenreBulkEdit);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should seed initial selection from getEpisodeIdsByGenreId', () => {
    expect(mockEpisodeGenreService.getEpisodeIdsByGenreId).toHaveBeenCalledWith('g1');
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

  it('onSave should call setEpisodesForGenre and navigate', async () => {
    component['toggleEpisode']('e3');
    await component['onSave']();

    expect(mockEpisodeGenreService.setEpisodesForGenre).toHaveBeenCalledWith(
      'g1',
      expect.arrayContaining(['e1', 'e2', 'e3'])
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/genres']);
  });

  it('onSave should noop when not dirty', async () => {
    await component['onSave']();
    expect(mockEpisodeGenreService.setEpisodesForGenre).not.toHaveBeenCalled();
  });

  it('onCancel should navigate back', () => {
    component['onCancel']();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/genres']);
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

  it('onSave noops when there is no selectedGenre', async () => {
    (mockGenreStore.selectedGenre as ReturnType<typeof signal<unknown>>).set(null);
    component['toggleEpisode']('e3');
    await component['onSave']();
    expect(mockEpisodeGenreService.setEpisodesForGenre).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('onSave resets saving flag if setEpisodesForGenre rejects', async () => {
    mockEpisodeGenreService.setEpisodesForGenre.mockRejectedValueOnce(new Error('boom'));
    component['toggleEpisode']('e3');
    await expect(component['onSave']()).rejects.toThrow('boom');
    expect(component['saving']()).toBe(false);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('captures junctionError when getEpisodeIdsByGenreId rejects', async () => {
    mockEpisodeGenreService.getEpisodeIdsByGenreId.mockReset();
    mockEpisodeGenreService.getEpisodeIdsByGenreId.mockRejectedValue(new Error('nope'));
    const fresh = TestBed.createComponent(GenreBulkEdit);
    await fresh.componentInstance.ngOnInit();
    await fresh.whenStable();
    fresh.detectChanges();
    expect(fresh.componentInstance['junctionError']()).toBe('nope');
    expect(fresh.componentInstance['loadingJunctions']()).toBe(false);
  });

  describe('template', () => {
    it('renders genre name in heading', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1.textContent).toContain('Rock');
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

    it('shows spinner while loading junctions', async () => {
      mockEpisodeStore.loading.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });

    it('shows genre store error when set', async () => {
      mockGenreStore.error.set('genre boom');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('genre boom');
    });

    it('shows "Genre not found." when selectedGenre is null', async () => {
      (mockGenreStore.selectedGenre as ReturnType<typeof signal<unknown>>).set(null);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('Genre not found.');
    });

    it('shows junctionError message', async () => {
      component['junctionError'].set('junction boom');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('junction boom');
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
