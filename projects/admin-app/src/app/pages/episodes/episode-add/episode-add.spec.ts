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
});
