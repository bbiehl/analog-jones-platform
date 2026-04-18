import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { CategoryStore } from '../../../../../../../libs/category/category.store';
import { EpisodeStore } from '../../../../../../../libs/episode/episode.store';
import { GenreStore } from '../../../../../../../libs/genre/genre.store';
import { TagStore } from '../../../../../../../libs/tag/tag.store';
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
    c.form.patchValue({ title: 'Test', episodeDuration: 60 });

    expect(c.submitting()).toBe(false);

    const submitPromise = c.onSubmit();
    expect(c.submitting()).toBe(true);

    resolveUpdate();
    await submitPromise;
    expect(c.submitting()).toBe(false);
  });

  it('should not submit twice if already submitting', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    c.form.patchValue({ title: 'Test', episodeDuration: 60 });

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
