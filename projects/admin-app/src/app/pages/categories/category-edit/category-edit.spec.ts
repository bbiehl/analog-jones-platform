import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { CategoryStore } from '@aj/core';
import { CategoryEdit } from './category-edit';

describe('CategoryEdit', () => {
  let component: CategoryEdit;
  let fixture: ComponentFixture<CategoryEdit>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCategoryStore: any;

  beforeEach(async () => {
    mockCategoryStore = {
      loading: vi.fn(() => false),
      error: vi.fn(() => null),
      selectedCategory: vi.fn(() => null),
      loadCategoryById: vi.fn(),
      updateCategory: vi.fn().mockResolvedValue(undefined),
      clearSelectedCategory: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CategoryEdit],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CategoryStore, useValue: mockCategoryStore },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: 'c1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryEdit);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the category by id on init', () => {
    expect(mockCategoryStore.loadCategoryById).toHaveBeenCalledWith('c1');
  });

  it('should display the "Edit Category" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Edit Category');
  });

  it('should have name and slug input fields', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(inputs.length).toBe(2);
  });

  it('should navigate to /categories on cancel', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: /Cancel/ }));

    await cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/categories']);
  });

  it('should clear selected category on destroy', () => {
    fixture.destroy();
    expect(mockCategoryStore.clearSelectedCategory).toHaveBeenCalled();
  });

  it('should show a spinner and no form while loading', async () => {
    mockCategoryStore.loading = vi.fn(() => true);
    fixture = TestBed.createComponent(CategoryEdit);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
    expect(await loader.getAllHarnesses(MatInputHarness)).toHaveLength(0);
  });

  it('should show the error text and no form when the store reports an error', async () => {
    mockCategoryStore.error = vi.fn(() => 'kaboom');
    fixture = TestBed.createComponent(CategoryEdit);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    const err = fixture.nativeElement.querySelector('p.text-red-400');
    expect(err?.textContent).toContain('kaboom');
    expect(await loader.getAllHarnesses(MatInputHarness)).toHaveLength(0);
  });

  it('should patch the form when selectedCategory becomes available', async () => {
    mockCategoryStore.selectedCategory = vi.fn(() => ({
      id: 'c1',
      name: 'Vinyl',
      slug: 'vinyl',
    }));
    fixture = TestBed.createComponent(CategoryEdit);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(await inputs[0].getValue()).toBe('Vinyl');
    expect(await inputs[1].getValue()).toBe('vinyl');
  });

  it('should auto-populate slug from name on input', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('Hello World!');
    expect(await inputs[1].getValue()).toBe('hello-world');
  });

  it('should strip leading and trailing hyphens when slugifying', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('  !!Cool Stuff!!  ');
    expect(await inputs[1].getValue()).toBe('cool-stuff');
  });

  it('should produce an empty slug when name has no alphanumerics', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('!!!');
    expect(await inputs[1].getValue()).toBe('');
  });

  it('should disable the save button when the form is invalid', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('');
    await inputs[1].setValue('');
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('should update the category and navigate on submit', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('Updated');
    await inputs[1].setValue('updated');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(false);
    await saveButton.click();
    await fixture.whenStable();

    expect(mockCategoryStore.updateCategory).toHaveBeenCalledWith('c1', {
      name: 'Updated',
      slug: 'updated',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/categories']);
  });

  it('should not update or navigate when the form is invalid', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component['onSubmit']();

    expect(mockCategoryStore.updateCategory).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should not navigate when the store reports an error after submit', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('Updated');
    await inputs[1].setValue('updated');

    mockCategoryStore.error = vi.fn(() => 'boom');
    await component['onSubmit']();

    expect(mockCategoryStore.updateCategory).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should not navigate when updateCategory rejects', async () => {
    mockCategoryStore.updateCategory = vi.fn().mockRejectedValue(new Error('fail'));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('Updated');
    await inputs[1].setValue('updated');

    await expect(component['onSubmit']()).rejects.toThrow('fail');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
