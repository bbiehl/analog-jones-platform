import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Timestamp } from 'firebase/firestore';
import { CategoryStore } from '@aj/core';
import { EpisodeStore } from '@aj/core';
import { GenreStore } from '@aj/core';
import { TagStore } from '@aj/core';
import { EpisodeEdit } from './episode-edit';

describe('EpisodeEdit', () => {
  let component: EpisodeEdit;
  let fixture: ComponentFixture<EpisodeEdit>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEpisodeStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCategoryStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGenreStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTagStore: any;

  beforeEach(async () => {
    mockEpisodeStore = {
      loading: vi.fn(() => false),
      error: vi.fn(() => null),
      selectedEpisode: vi.fn(() => null),
      loadEpisodeById: vi.fn(),
      updateEpisode: vi.fn().mockResolvedValue(undefined),
      clearSelectedEpisode: vi.fn(),
    };
    mockCategoryStore = {
      categories: vi.fn(() => []),
      loadCategories: vi.fn(),
    };
    mockGenreStore = {
      genres: vi.fn(() => []),
      loadGenres: vi.fn(),
    };
    mockTagStore = {
      tags: vi.fn(() => []),
      loadTags: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EpisodeEdit],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: EpisodeStore, useValue: mockEpisodeStore },
        { provide: CategoryStore, useValue: mockCategoryStore },
        { provide: GenreStore, useValue: mockGenreStore },
        { provide: TagStore, useValue: mockTagStore },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: 'ep1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeEdit);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the episode by id on init', () => {
    expect(mockEpisodeStore.loadEpisodeById).toHaveBeenCalledWith('ep1');
  });

  it('should load categories, genres, and tags on init', () => {
    expect(mockCategoryStore.loadCategories).toHaveBeenCalled();
    expect(mockGenreStore.loadGenres).toHaveBeenCalled();
    expect(mockTagStore.loadTags).toHaveBeenCalled();
  });

  it('should display the "Edit Episode" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Edit Episode');
  });

  it('should navigate to /episodes on cancel', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: /Cancel/ }));

    await cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/episodes']);
  });

  it('should clear selected episode on destroy', () => {
    fixture.destroy();
    expect(mockEpisodeStore.clearSelectedEpisode).toHaveBeenCalled();
  });

  it('should toggle submitting while the update call is in flight', async () => {
    let resolveUpdate!: () => void;
    mockEpisodeStore.updateEpisode.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      })
    );
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Test' });

    expect(c.submitting()).toBe(false);

    const submitPromise = c.onSubmit();
    expect(c.submitting()).toBe(true);

    resolveUpdate();
    await submitPromise;
    expect(c.submitting()).toBe(false);
  });

  it('should render an inline error when updateEpisode fails after the episode is loaded', async () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({ id: 'ep1' });
    mockEpisodeStore.updateEpisode.mockImplementationOnce(async () => {
      mockEpisodeStore.error.mockReturnValue('Update failed');
    });
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Updated' });

    await c.onSubmit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Update failed');
  });

  it('should not render a stale store error on entry before submission', () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({
      id: 'ep1',
      title: 'Loaded',
      episodeDate: { toDate: () => new Date() },
      intelligence: null,
      isVisible: false,
      links: {},
      posterUrl: null,
      categories: [],
      genres: [],
      tags: [],
    });
    mockEpisodeStore.error.mockReturnValue('Stale failure from list page');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeNull();
  });

  it('should clear a previous submit error when starting a new submission', async () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({ id: 'ep1' });
    mockEpisodeStore.updateEpisode.mockImplementationOnce(async () => {
      mockEpisodeStore.error.mockReturnValue('Update failed');
    });
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Updated' });

    await c.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    let resolveUpdate!: () => void;
    mockEpisodeStore.updateEpisode.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      })
    );
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const submitPromise = c.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();

    mockEpisodeStore.error.mockReturnValue(null);
    resolveUpdate();
    await submitPromise;
  });

  it('should disable the header back button while submitting', async () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({ id: 'ep1' });
    fixture.detectChanges();

    let resolveUpdate!: () => void;
    mockEpisodeStore.updateEpisode.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      })
    );
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Test' });

    const backButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Back to episodes"]' })
    );
    expect(await backButton.isDisabled()).toBe(false);

    const submitPromise = c.onSubmit();
    fixture.detectChanges();
    expect(await backButton.isDisabled()).toBe(true);

    resolveUpdate();
    await submitPromise;
    fixture.detectChanges();
    expect(await backButton.isDisabled()).toBe(false);
  });

  it('should show the initial loading spinner while loading and no selected episode', async () => {
    mockEpisodeStore.loading.mockReturnValue(true);
    mockEpisodeStore.selectedEpisode.mockReturnValue(null);
    fixture.destroy();
    fixture = TestBed.createComponent(EpisodeEdit);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('should show the load-error message when error and no selected episode', () => {
    mockEpisodeStore.loading.mockReturnValue(false);
    mockEpisodeStore.selectedEpisode.mockReturnValue(null);
    mockEpisodeStore.error.mockReturnValue('Failed to load');
    fixture.destroy();
    fixture = TestBed.createComponent(EpisodeEdit);
    fixture.detectChanges();

    const errEl = fixture.nativeElement.querySelector('.text-red-400');
    expect(errEl).not.toBeNull();
    expect(errEl.textContent).toContain('Failed to load');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('should populate the form and poster preview from the selected episode', () => {
    const episodeDate = new Date('2025-01-15T00:00:00Z');
    mockEpisodeStore.selectedEpisode.mockReturnValue({
      id: 'ep1',
      title: 'Loaded Title',
      episodeDate: { toDate: () => episodeDate },
      intelligence: '# heading',
      isVisible: true,
      links: { spotify: 'https://spot', youtube: 'https://yt' },
      posterUrl: 'https://example.com/poster.jpg',
      categories: [{ id: 'c1' }, { id: 'c2' }],
      genres: [{ id: 'g1' }],
      tags: [{ id: 't1' }],
    });
    fixture.destroy();
    fixture = TestBed.createComponent(EpisodeEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    expect(c.form.controls.title.value).toBe('Loaded Title');
    expect(c.form.controls.episodeDate.value).toBe(episodeDate);
    expect(c.form.controls.intelligence.value).toBe('# heading');
    expect(c.form.controls.isVisible.value).toBe(true);
    expect(c.form.controls.spotifyLink.value).toBe('https://spot');
    expect(c.form.controls.youtubeLink.value).toBe('https://yt');
    expect(c.form.controls.categoryIds.value).toEqual(['c1', 'c2']);
    expect(c.form.controls.genreIds.value).toEqual(['g1']);
    expect(c.form.controls.tagIds.value).toEqual(['t1']);
    expect(c.posterPreview()).toBe('https://example.com/poster.jpg');
  });

  it('should clear poster preview and mark removed when removePoster is called', () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({
      id: 'ep1',
      title: 'T',
      episodeDate: { toDate: () => new Date() },
      intelligence: null,
      isVisible: false,
      links: {},
      posterUrl: 'https://example.com/p.jpg',
      categories: [],
      genres: [],
      tags: [],
    });
    fixture.destroy();
    fixture = TestBed.createComponent(EpisodeEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    expect(c.posterPreview()).toBe('https://example.com/p.jpg');

    c.removePoster();
    fixture.detectChanges();

    expect(c.posterPreview()).toBeNull();
    expect(c.posterFile()).toBeNull();
    expect(c.posterRemoved()).toBe(true);
    // The "Choose Image" button should now be visible (no preview)
    expect(fixture.nativeElement.querySelector('img[alt="Poster preview"]')).toBeNull();
  });

  it('should toggle the markdown preview', () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({
      id: 'ep1',
      title: 'T',
      episodeDate: { toDate: () => new Date() },
      intelligence: '# hi',
      isVisible: false,
      links: {},
      posterUrl: null,
      categories: [],
      genres: [],
      tags: [],
    });
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    expect(c.showMarkdownPreview()).toBe(false);
    expect(fixture.nativeElement.querySelector('textarea')).not.toBeNull();

    c.togglePreview();
    fixture.detectChanges();

    expect(c.showMarkdownPreview()).toBe(true);
    expect(fixture.nativeElement.querySelector('.markdown-preview')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
  });

  it('should call updateEpisode with form values, ids, poster flags, and a Timestamp', async () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({ id: 'ep1' });
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const date = new Date('2025-06-01T00:00:00Z');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({
      title: 'New Title',
      episodeDate: date,
      intelligence: 'body',
      isVisible: true,
      spotifyLink: 'https://spot',
      youtubeLink: '',
      categoryIds: ['c1'],
      genreIds: ['g1'],
      tagIds: ['t1', 't2'],
    });

    await c.onSubmit();

    expect(mockEpisodeStore.updateEpisode).toHaveBeenCalledTimes(1);
    const args = mockEpisodeStore.updateEpisode.mock.calls[0];
    expect(args[0]).toBe('ep1');
    const payload = args[1];
    expect(payload.title).toBe('New Title');
    expect(payload.intelligence).toBe('body');
    expect(payload.isVisible).toBe(true);
    expect(payload.links).toEqual({ spotify: 'https://spot' });
    expect(payload.episodeDate).toBeInstanceOf(Timestamp);
    expect(payload.episodeDate.toDate().getTime()).toBe(date.getTime());
    expect(args[2]).toEqual(['c1']);
    expect(args[3]).toEqual(['g1']);
    expect(args[4]).toEqual(['t1', 't2']);
    expect(args[5]).toBeUndefined();
    expect(args[6]).toBe(false);

    expect(navigateSpy).toHaveBeenCalledWith(['/episodes']);
  });

  it('should send intelligence as null when the field is empty', async () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({ id: 'ep1' });
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'T', intelligence: '' });

    await c.onSubmit();

    const payload = mockEpisodeStore.updateEpisode.mock.calls[0][1];
    expect(payload.intelligence).toBeNull();
  });

  it('should not call updateEpisode when the form is invalid', async () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({ id: 'ep1' });
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: '' }); // required violation

    await c.onSubmit();

    expect(mockEpisodeStore.updateEpisode).not.toHaveBeenCalled();
  });

  it('should disable the Save button when the form is invalid', async () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({ id: 'ep1' });
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: '' });
    fixture.detectChanges();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('should pass the chosen poster file through to updateEpisode', async () => {
    mockEpisodeStore.selectedEpisode.mockReturnValue({ id: 'ep1' });
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    const file = new File(['x'], 'p.png', { type: 'image/png' });
    c.posterFile.set(file);
    c.form.patchValue({ title: 'T' });

    await c.onSubmit();

    expect(mockEpisodeStore.updateEpisode.mock.calls[0][5]).toBe(file);
  });

  it('should not submit twice if already submitting', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Test' });

    let resolveUpdate!: () => void;
    mockEpisodeStore.updateEpisode.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      })
    );
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const firstSubmit = c.onSubmit();
    await c.onSubmit(); // second call should no-op

    expect(mockEpisodeStore.updateEpisode).toHaveBeenCalledTimes(1);

    resolveUpdate();
    await firstSubmit;
  });
});
