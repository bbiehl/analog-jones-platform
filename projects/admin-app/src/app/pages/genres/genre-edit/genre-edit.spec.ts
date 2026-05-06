import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
import { GenreStore } from '@aj/core';
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

  it('should show a spinner and hide the form while loading', async () => {
    mockGenreStore.loading = vi.fn(() => true);
    fixture = TestBed.createComponent(GenreEdit);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    const spinners = await loader.getAllHarnesses(MatProgressSpinnerHarness);
    expect(spinners.length).toBe(1);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('should show the error message when the store has an error', async () => {
    mockGenreStore.error = vi.fn(() => 'Boom');
    fixture = TestBed.createComponent(GenreEdit);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    const errorEl = fixture.nativeElement.querySelector('.text-red-400');
    expect(errorEl?.textContent).toContain('Boom');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('should patch the form when selectedGenre is available', async () => {
    mockGenreStore.selectedGenre = vi.fn(() => ({
      id: 'g1',
      name: 'Rock',
      slug: 'rock',
    }));
    fixture = TestBed.createComponent(GenreEdit);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(await inputs[0].getValue()).toBe('Rock');
    expect(await inputs[1].getValue()).toBe('rock');
  });

  it('should auto-generate a slug from the name on input', async () => {
    fixture.detectChanges();
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    const nameInput = inputs[0];

    await nameInput.setValue('Hard Rock & Roll!');
    // setValue triggers the (input) handler
    expect(component['form'].controls.slug.value).toBe('hard-rock-roll');
  });

  it('should disable the Save button when the form is invalid', async () => {
    fixture.detectChanges();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('should not call updateGenre when the form is invalid on submit', async () => {
    fixture.detectChanges();
    await component['onSubmit']();
    expect(mockGenreStore.updateGenre).not.toHaveBeenCalled();
  });

  it('should update the genre and navigate on successful submit', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['form'].setValue({ name: 'Jazz', slug: 'jazz' });
    fixture.detectChanges();

    await component['onSubmit']();

    expect(mockGenreStore.updateGenre).toHaveBeenCalledWith('g1', {
      name: 'Jazz',
      slug: 'jazz',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/genres']);
  });

  it('should not navigate when updateGenre results in an error', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    mockGenreStore.error = vi.fn(() => 'Failed to update');

    component['form'].setValue({ name: 'Jazz', slug: 'jazz' });
    fixture.detectChanges();

    await component['onSubmit']();

    expect(mockGenreStore.updateGenre).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
