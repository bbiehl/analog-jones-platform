import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { CategoryStore } from '@aj/core';
import { CategoryAdd } from './category-add';

describe('CategoryAdd', () => {
  let component: CategoryAdd;
  let fixture: ComponentFixture<CategoryAdd>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCategoryStore: any;

  beforeEach(async () => {
    mockCategoryStore = {
      createCategory: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(() => null),
    };

    await TestBed.configureTestingModule({
      imports: [CategoryAdd],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CategoryStore, useValue: mockCategoryStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryAdd);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the "Add Category" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Add Category');
  });

  it('should have name and slug input fields', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(inputs.length).toBe(2);
  });

  it('should have the save button disabled when form is empty', async () => {
    const saveButton = await loader.getHarness(
      MatButtonHarness.with({ text: /Save/ })
    );
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('should navigate to /categories on cancel', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: /Cancel/ }));

    await cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/categories']);
  });

  it('should auto-populate slug from name on input', async () => {
    const nameInput = (await loader.getAllHarnesses(MatInputHarness))[0];
    await nameInput.setValue('Hello World!');

    const slugInput = (await loader.getAllHarnesses(MatInputHarness))[1];
    expect(await slugInput.getValue()).toBe('hello-world');
  });

  it('should strip leading and trailing hyphens when slugifying', async () => {
    const nameInput = (await loader.getAllHarnesses(MatInputHarness))[0];
    await nameInput.setValue('  !!Cool Stuff!!  ');

    const slugInput = (await loader.getAllHarnesses(MatInputHarness))[1];
    expect(await slugInput.getValue()).toBe('cool-stuff');
  });

  it('should produce an empty slug when name has no alphanumerics', async () => {
    const nameInput = (await loader.getAllHarnesses(MatInputHarness))[0];
    await nameInput.setValue('!!!');

    const slugInput = (await loader.getAllHarnesses(MatInputHarness))[1];
    expect(await slugInput.getValue()).toBe('');
  });

  it('should create the category and navigate on submit', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('My Cat');
    await inputs[1].setValue('my-cat');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(false);
    await saveButton.click();
    await fixture.whenStable();

    expect(mockCategoryStore.createCategory).toHaveBeenCalledWith({
      name: 'My Cat',
      slug: 'my-cat',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/categories']);
  });

  it('should not create or navigate when form is invalid', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component['onSubmit']();

    expect(mockCategoryStore.createCategory).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should not navigate when the store reports an error after submit', async () => {
    mockCategoryStore.error = vi.fn(() => 'boom');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('My Cat');
    await inputs[1].setValue('my-cat');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    await saveButton.click();
    await fixture.whenStable();

    expect(mockCategoryStore.createCategory).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should not navigate when createCategory rejects', async () => {
    mockCategoryStore.createCategory = vi.fn().mockRejectedValue(new Error('fail'));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('My Cat');
    await inputs[1].setValue('my-cat');

    await expect(component['onSubmit']()).rejects.toThrow('fail');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
