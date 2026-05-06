import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { CategoryStore } from '@aj/core';
import { EpisodeStore } from '@aj/core';
import { GenreStore } from '@aj/core';
import { TagStore } from '@aj/core';
import { EpisodeAdd } from './episode-add';

describe('EpisodeAdd', () => {
  let component: EpisodeAdd;
  let fixture: ComponentFixture<EpisodeAdd>;
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
      createEpisode: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(() => null),
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
      imports: [EpisodeAdd],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: EpisodeStore, useValue: mockEpisodeStore },
        { provide: CategoryStore, useValue: mockCategoryStore },
        { provide: GenreStore, useValue: mockGenreStore },
        { provide: TagStore, useValue: mockTagStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeAdd);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the "Add Episode" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Add Episode');
  });

  it('should load categories, genres, and tags on init', () => {
    expect(mockCategoryStore.loadCategories).toHaveBeenCalled();
    expect(mockGenreStore.loadGenres).toHaveBeenCalled();
    expect(mockTagStore.loadTags).toHaveBeenCalled();
  });

  it('should navigate to /episodes on cancel', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: /Cancel/ }));

    await cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/episodes']);
  });

  it('should toggle submitting while the create call is in flight', async () => {
    let resolveCreate!: () => void;
    mockEpisodeStore.createEpisode.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
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

    resolveCreate();
    await submitPromise;
    expect(c.submitting()).toBe(false);
  });

  it('should render an inline error when createEpisode fails', async () => {
    mockEpisodeStore.createEpisode.mockImplementationOnce(async () => {
      mockEpisodeStore.error.mockReturnValue('Create failed');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'New' });

    await c.onSubmit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Create failed');
  });

  it('should not render a stale store error on entry before submission', () => {
    mockEpisodeStore.error.mockReturnValue('Stale failure from list page');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeNull();
  });

  it('should clear a previous submit error when starting a new submission', async () => {
    // First submission fails and renders the banner
    mockEpisodeStore.createEpisode.mockImplementationOnce(async () => {
      mockEpisodeStore.error.mockReturnValue('Create failed');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'New' });

    await c.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    // Second submission is in flight — banner should be cleared while pending
    let resolveCreate!: () => void;
    mockEpisodeStore.createEpisode.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
      })
    );
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const submitPromise = c.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();

    mockEpisodeStore.error.mockReturnValue(null);
    resolveCreate();
    await submitPromise;
  });

  it('should disable the header back button while submitting', async () => {
    let resolveCreate!: () => void;
    mockEpisodeStore.createEpisode.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
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

    resolveCreate();
    await submitPromise;
    fixture.detectChanges();
    expect(await backButton.isDisabled()).toBe(false);
  });

  it('should not submit twice if already submitting', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Test' });

    let resolveCreate!: () => void;
    mockEpisodeStore.createEpisode.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
      })
    );
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const firstSubmit = c.onSubmit();
    await c.onSubmit(); // second call should no-op

    expect(mockEpisodeStore.createEpisode).toHaveBeenCalledTimes(1);

    resolveCreate();
    await firstSubmit;
  });

  it('should not call createEpisode when the form is invalid', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    // title is required and starts empty
    expect(c.form.invalid).toBe(true);

    await c.onSubmit();

    expect(mockEpisodeStore.createEpisode).not.toHaveBeenCalled();
  });

  it('should navigate to /episodes after a successful submission', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Hello' });

    await c.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/episodes']);
  });

  it('should map form values to the createEpisode payload', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const date = new Date(2025, 0, 15);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({
      title: 'My Title',
      episodeDate: date,
      intelligence: '# hi',
      isVisible: true,
      spotifyLink: 'https://spotify.example/x',
      youtubeLink: 'https://youtube.example/y',
      categoryIds: ['c1'],
      genreIds: ['g1', 'g2'],
      tagIds: ['t1'],
    });

    await c.onSubmit();

    expect(mockEpisodeStore.createEpisode).toHaveBeenCalledTimes(1);
    const [data, categoryIds, genreIds, tagIds, posterFile] =
      mockEpisodeStore.createEpisode.mock.calls[0];
    expect(data).toMatchObject({
      title: 'My Title',
      intelligence: '# hi',
      isVisible: true,
      links: { spotify: 'https://spotify.example/x', youtube: 'https://youtube.example/y' },
      posterUrl: null,
    });
    expect(data.episodeDate.toDate().getTime()).toBe(date.getTime());
    expect(categoryIds).toEqual(['c1']);
    expect(genreIds).toEqual(['g1', 'g2']);
    expect(tagIds).toEqual(['t1']);
    expect(posterFile).toBeUndefined();
  });

  it('should omit empty link fields and send null intelligence when blank', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Title' });

    await c.onSubmit();

    const [data] = mockEpisodeStore.createEpisode.mock.calls[0];
    expect(data.links).toEqual({});
    expect(data.intelligence).toBeNull();
  });

  it('should toggle markdown preview state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    expect(c.showMarkdownPreview()).toBe(false);
    c.togglePreview();
    expect(c.showMarkdownPreview()).toBe(true);
    c.togglePreview();
    expect(c.showMarkdownPreview()).toBe(false);
  });

  it('should render markdown preview html when toggled on', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.controls.intelligence.setValue('# Heading');
    await fixture.whenStable();
    c.togglePreview();
    fixture.detectChanges();

    const preview = fixture.nativeElement.querySelector('.markdown-preview');
    expect(preview).not.toBeNull();
    expect(preview.innerHTML).toContain('<h1');
    expect(preview.innerHTML).toContain('Heading');
  });

  it('should clear the poster file and preview when removePoster is called', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.posterFile.set(new File(['x'], 'x.png', { type: 'image/png' }));
    c.posterPreview.set('data:image/png;base64,abc');

    c.removePoster();

    expect(c.posterFile()).toBeNull();
    expect(c.posterPreview()).toBeNull();
  });

  it('should set the poster file and preview when a file is selected', async () => {
    const dataUrl = 'data:image/png;base64,Zm9v';
    class FakeFileReader {
      result: string | null = null;
      onload: (() => void) | null = null;
      readAsDataURL(_blob: Blob): void {
        this.result = dataUrl;
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('FileReader', FakeFileReader);

    const file = new File(['x'], 'poster.png', { type: 'image/png' });
    const event = {
      target: { files: [file] } as unknown as HTMLInputElement,
    } as unknown as Event;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.onPosterSelected(event);

    await new Promise((r) => setTimeout(r, 0));

    expect(c.posterFile()).toBe(file);
    expect(c.posterPreview()).toBe(dataUrl);

    vi.unstubAllGlobals();
  });

  it('should pass the selected poster file to createEpisode', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const file = new File(['x'], 'poster.png', { type: 'image/png' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.posterFile.set(file);
    c.form.patchValue({ title: 'Title' });

    await c.onSubmit();

    const [, , , , posterFile] = mockEpisodeStore.createEpisode.mock.calls[0];
    expect(posterFile).toBe(file);
  });

  it('should disable the Save button when the form is invalid', async () => {
    // form starts invalid (title required)
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Now valid' });
    fixture.detectChanges();

    expect(await saveButton.isDisabled()).toBe(false);
  });
});
