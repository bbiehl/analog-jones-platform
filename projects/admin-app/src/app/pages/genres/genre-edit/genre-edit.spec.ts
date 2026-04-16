import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { GenreStore } from '../../../../../../../libs/genre/genre.store';
import { GenreEdit } from './genre-edit';

describe('GenreEdit', () => {
  let component: GenreEdit;
  let fixture: ComponentFixture<GenreEdit>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGenreStore: any;

  beforeEach(async () => {
    mockGenreStore = {
      loading: vi.fn(() => false),
      error: vi.fn(() => null),
      selectedGenre: vi.fn(() => null),
      loadGenreById: vi.fn(),
      updateGenre: vi.fn().mockResolvedValue(undefined),
      clearSelectedGenre: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GenreEdit],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: GenreStore, useValue: mockGenreStore },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: 'g1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenreEdit);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the genre by id on init', () => {
    expect(mockGenreStore.loadGenreById).toHaveBeenCalledWith('g1');
  });

  it('should display the "Edit Genre" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Edit Genre');
  });

  it('should have name and slug input fields', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(inputs.length).toBe(2);
  });

  it('should navigate to /genres on cancel', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: /Cancel/ }));

    await cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/genres']);
  });

  it('should clear selected genre on destroy', () => {
    fixture.destroy();
    expect(mockGenreStore.clearSelectedGenre).toHaveBeenCalled();
  });
});
