import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { GenreStore } from '../../../../../../libs/genre/genre.store';
import { Genres } from './genres';

describe('Genres', () => {
  let component: Genres;
  let fixture: ComponentFixture<Genres>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGenreStore: any;

  beforeEach(async () => {
    mockGenreStore = {
      loading: vi.fn(() => false),
      error: vi.fn(() => null),
      genres: vi.fn(() => [
        { id: 'g1', name: 'Action', slug: 'action' },
        { id: 'g2', name: 'Drama', slug: 'drama' },
      ]),
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
});
