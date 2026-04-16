import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { GenreStore } from '../../../../../../../libs/genre/genre.store';
import { GenreAdd } from './genre-add';

describe('GenreAdd', () => {
  let component: GenreAdd;
  let fixture: ComponentFixture<GenreAdd>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGenreStore: any;

  beforeEach(async () => {
    mockGenreStore = {
      createGenre: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [GenreAdd],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: GenreStore, useValue: mockGenreStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenreAdd);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the "Add Genre" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Add Genre');
  });

  it('should have name and slug input fields', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(inputs.length).toBe(2);
  });

  it('should have the save button disabled when form is empty', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('should navigate to /genres on cancel', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: /Cancel/ }));

    await cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/genres']);
  });
});
