/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
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
    await component.ngOnInit();
    fixture.detectChanges();
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
});
