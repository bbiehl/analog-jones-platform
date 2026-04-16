import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { CategoryStore } from '../../../../../../../libs/category/category.store';
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
});
