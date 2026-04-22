import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Timestamp } from 'firebase/firestore';
import { Subject } from 'rxjs';
import { Episode } from '../../../../../../libs/episode/episode.model';
import { EpisodeStore } from '../../../../../../libs/episode/episode.store';
import { Episodes } from './episodes';

function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: 'e1',
    createdAt: Timestamp.fromMillis(0),
    episodeDate: Timestamp.fromMillis(1_700_000_000_000),
    intelligence: null,
    isVisible: true,
    links: {},
    posterUrl: null,
    title: 'Episode One',
    ...overrides,
  };
}

describe('Episodes', () => {
  let component: Episodes;
  let fixture: ComponentFixture<Episodes>;
  let loader: HarnessLoader;

  const loading = signal(false);
  const error = signal<string | null>(null);
  const episodes = signal<Episode[]>([]);

  let mockEpisodeStore: {
    loading: () => boolean;
    error: () => string | null;
    episodes: () => Episode[];
    loadEpisodes: ReturnType<typeof vi.fn>;
    deleteEpisode: ReturnType<typeof vi.fn>;
    toggleEpisodeVisibility: ReturnType<typeof vi.fn>;
  };

  async function setup(initial: { loading?: boolean; error?: string | null; episodes?: Episode[] } = {}) {
    loading.set(initial.loading ?? false);
    error.set(initial.error ?? null);
    episodes.set(initial.episodes ?? []);

    mockEpisodeStore = {
      loading: () => loading(),
      error: () => error(),
      episodes: () => episodes(),
      loadEpisodes: vi.fn(),
      deleteEpisode: vi.fn().mockResolvedValue(undefined),
      toggleEpisodeVisibility: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Episodes],
      providers: [provideRouter([]), { provide: EpisodeStore, useValue: mockEpisodeStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(Episodes);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    beforeEach(() => setup());

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load episodes on init', () => {
      expect(mockEpisodeStore.loadEpisodes).toHaveBeenCalled();
    });

    it('should display the "Episodes" heading', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1.textContent).toContain('Episodes');
    });

    it('should have an "Add Episode" button', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Episode/ }));
      expect(button).toBeTruthy();
    });
  });

  describe('view states', () => {
    it('should show a spinner when loading', async () => {
      await setup({ loading: true });
      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should show an error message when error is set', async () => {
      await setup({ error: 'Boom' });
      const errEl = fixture.nativeElement.querySelector('.text-red-400');
      expect(errEl.textContent).toContain('Boom');
    });

    it('should show an empty-state message when there are no episodes', async () => {
      await setup({ episodes: [] });
      expect(fixture.nativeElement.textContent).toContain('No episodes yet');
    });

    it('should render a table row per episode', async () => {
      await setup({
        episodes: [
          makeEpisode({ id: 'e1', title: 'Alpha' }),
          makeEpisode({ id: 'e2', title: 'Bravo' }),
        ],
      });
      const table = await loader.getHarness(MatTableHarness);
      const rows = await table.getRows();
      expect(rows.length).toBe(2);
    });

    it('should display title and formatted date in the row', async () => {
      await setup({
        episodes: [
          makeEpisode({ id: 'e1', title: 'Alpha', episodeDate: Timestamp.fromMillis(1_700_000_000_000) }),
        ],
      });
      const table = await loader.getHarness(MatTableHarness);
      const cells = await (await table.getRows())[0].getCells();
      const texts = await Promise.all(cells.map((c) => c.getText()));
      expect(texts[0]).toBe('Alpha');
      expect(texts[1]).toContain('2023');
    });
  });

  describe('navigation', () => {
    beforeEach(() => setup({ episodes: [makeEpisode()] }));

    it('should navigate to /episodes/add on add button click', async () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Episode/ }));

      await button.click();

      expect(navigateSpy).toHaveBeenCalledWith(['/episodes/add']);
    });

    it('should navigate to /episodes/edit/:id on edit click', async () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const editBtn = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Edit episode"]' }));

      await editBtn.click();

      expect(navigateSpy).toHaveBeenCalledWith(['/episodes/edit', 'e1']);
    });
  });

  describe('delete', () => {
    beforeEach(() => setup({ episodes: [makeEpisode({ id: 'e1' })] }));

    it('should delete when user confirms', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const delBtn = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Delete episode"]' }));

      await delBtn.click();

      expect(mockEpisodeStore.deleteEpisode).toHaveBeenCalledWith('e1');
    });

    it('should not delete when user cancels', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const delBtn = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Delete episode"]' }));

      await delBtn.click();

      expect(mockEpisodeStore.deleteEpisode).not.toHaveBeenCalled();
    });
  });

  describe('visibility toggle', () => {
    it('should call toggleEpisodeVisibility with new value', async () => {
      await setup({ episodes: [makeEpisode({ id: 'e1', isVisible: true })] });
      const toggle = await loader.getHarness(MatSlideToggleHarness);

      await toggle.toggle();

      expect(mockEpisodeStore.toggleEpisodeVisibility).toHaveBeenCalledWith('e1', false);
    });
  });

  describe('filtering', () => {
    beforeEach(() =>
      setup({
        episodes: [
          makeEpisode({ id: 'e1', title: 'Alpha' }),
          makeEpisode({ id: 'e2', title: 'Bravo' }),
        ],
      })
    );

    it('filterPredicate matches case-insensitive title substring', () => {
      const ds = (component as unknown as { dataSource: { filterPredicate: (e: Episode, f: string) => boolean } }).dataSource;
      expect(ds.filterPredicate(makeEpisode({ title: 'Alpha' }), 'alp')).toBe(true);
      expect(ds.filterPredicate(makeEpisode({ title: 'Alpha' }), 'zzz')).toBe(false);
    });

    it('sortingDataAccessor returns lowercase title for "title"', () => {
      const ds = (component as unknown as { dataSource: { sortingDataAccessor: (e: Episode, h: string) => string | number } }).dataSource;
      expect(ds.sortingDataAccessor(makeEpisode({ title: 'Alpha' }), 'title')).toBe('alpha');
    });

    it('sortingDataAccessor returns millis for "episodeDate"', () => {
      const ds = (component as unknown as { dataSource: { sortingDataAccessor: (e: Episode, h: string) => string | number } }).dataSource;
      const ts = Timestamp.fromMillis(123456);
      expect(ds.sortingDataAccessor(makeEpisode({ episodeDate: ts }), 'episodeDate')).toBe(123456);
    });

    it('sortingDataAccessor returns "" for unknown column', () => {
      const ds = (component as unknown as { dataSource: { sortingDataAccessor: (e: Episode, h: string) => string | number } }).dataSource;
      expect(ds.sortingDataAccessor(makeEpisode(), 'unknown')).toBe('');
    });

    it('applyFilter trims, lowercases, and resets paginator to first page', () => {
      const ds = (component as unknown as { dataSource: { filter: string; paginator: unknown } }).dataSource;
      const firstPage = vi.fn();
      ds.paginator = { firstPage, page: new Subject(), initialized: new Subject(), pageIndex: 0, pageSize: 10, length: 0 };

      (component as unknown as { applyFilter: (v: string) => void }).applyFilter('  Alpha  ');

      expect(ds.filter).toBe('alpha');
      expect(firstPage).toHaveBeenCalled();
    });

    it('shows the clear button when filterValue is set and clears on click', async () => {
      const input = fixture.nativeElement.querySelector('input[matInput]') as HTMLInputElement;
      input.value = 'alpha';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();

      const clearBtn = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Clear filter"]' }));
      await clearBtn.click();

      expect((component as unknown as { filterValue: string }).filterValue).toBe('');
    });
  });

  describe('episodes signal → dataSource sync', () => {
    it('updates dataSource.data when the episodes signal changes', async () => {
      await setup({ episodes: [makeEpisode({ id: 'e1', title: 'Alpha' })] });
      const ds = (component as unknown as { dataSource: { data: Episode[] } }).dataSource;
      expect(ds.data.length).toBe(1);

      episodes.set([
        makeEpisode({ id: 'e1', title: 'Alpha' }),
        makeEpisode({ id: 'e2', title: 'Bravo' }),
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(ds.data.length).toBe(2);
    });
  });
});
