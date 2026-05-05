import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { GenreStore } from '@aj/core';
import { Genres } from './genres';

describe('Genres', () => {
  let component: Genres;
  let fixture: ComponentFixture<Genres>;
  let loader: HarnessLoader;
  let loading: ReturnType<typeof signal<boolean>>;
  let error: ReturnType<typeof signal<string | null>>;
  let genres: ReturnType<typeof signal<{ id: string; name: string; slug: string }[]>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGenreStore: any;

  beforeEach(async () => {
    loading = signal(false);
    error = signal<string | null>(null);
    genres = signal([
      { id: 'g1', name: 'Action', slug: 'action' },
      { id: 'g2', name: 'Drama', slug: 'drama' },
    ]);
    mockGenreStore = {
      loading,
      error,
      genres,
      loadGenres: vi.fn(),
      deleteGenre: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Genres],
      providers: [
        provideRouter([]),
        { provide: GenreStore, useValue: mockGenreStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Genres);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load genres on init', () => {
    expect(mockGenreStore.loadGenres).toHaveBeenCalled();
  });

  it('should display the "Genres" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Genres');
  });

  it('should have an "Add Genre" button', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Genre/ }));
    expect(button).toBeTruthy();
  });

  it('should navigate to /genres/add on add button click', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Genre/ }));

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/genres/add']);
  });

  it('should display genres in a table', async () => {
    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    expect(rows.length).toBe(2);
  });

  it('should display genre data in the table', async () => {
    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    const firstRowCells = await rows[0].getCells();
    const cellTexts = await Promise.all(firstRowCells.map((c) => c.getText()));
    expect(cellTexts[0]).toBe('Action');
    expect(cellTexts[1]).toBe('action');
  });

  it('should show a spinner when loading', async () => {
    loading.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('should show the error message when error is set', async () => {
    error.set('Something went wrong');
    fixture.detectChanges();
    await fixture.whenStable();

    const errorEl = fixture.nativeElement.querySelector('.text-red-400');
    expect(errorEl?.textContent).toContain('Something went wrong');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('should show an empty-state message when there are no genres', async () => {
    genres.set([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No genres yet');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('should navigate to edit route when edit button is clicked', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Edit genre"]' }),
    );

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/genres/edit', 'g1']);
  });

  it('should navigate to bulk-edit route when bulk-edit button is clicked', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Bulk edit episodes in genre"]' }),
    );

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/genres/bulk-edit', 'g1']);
  });

  it('should delete the genre when delete is confirmed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Delete genre"]' }),
    );

    await button.click();
    await fixture.whenStable();

    expect(mockGenreStore.deleteGenre).toHaveBeenCalledWith('g1');
    vi.unstubAllGlobals();
  });

  it('should not delete the genre when delete is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Delete genre"]' }),
    );

    await button.click();
    await fixture.whenStable();

    expect(mockGenreStore.deleteGenre).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
