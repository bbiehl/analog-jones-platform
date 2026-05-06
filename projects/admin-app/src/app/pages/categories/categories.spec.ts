import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { CategoryStore } from '@aj/core';
import { Categories } from './categories';

describe('Categories', () => {
  let component: Categories;
  let fixture: ComponentFixture<Categories>;
  let loader: HarnessLoader;
  let loading: ReturnType<typeof signal<boolean>>;
  let error: ReturnType<typeof signal<string | null>>;
  let categories: ReturnType<
    typeof signal<{ id: string; name: string; slug: string }[]>
  >;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCategoryStore: any;

  beforeEach(async () => {
    loading = signal(false);
    error = signal<string | null>(null);
    categories = signal([
      { id: 'c1', name: 'History', slug: 'history' },
      { id: 'c2', name: 'Science', slug: 'science' },
    ]);
    mockCategoryStore = {
      loading,
      error,
      categories,
      loadCategories: vi.fn(),
      deleteCategory: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Categories],
      providers: [
        provideRouter([]),
        { provide: CategoryStore, useValue: mockCategoryStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Categories);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', () => {
    expect(mockCategoryStore.loadCategories).toHaveBeenCalled();
  });

  it('should display the "Categories" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Categories');
  });

  it('should have an "Add Category" button', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Category/ }));
    expect(button).toBeTruthy();
  });

  it('should navigate to /categories/add on add button click', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Category/ }));

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/categories/add']);
  });

  it('should display categories in a table', async () => {
    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    expect(rows.length).toBe(2);
  });

  it('should display category data in the table', async () => {
    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    const firstRowCells = await rows[0].getCells();
    const cellTexts = await Promise.all(firstRowCells.map((c) => c.getText()));
    expect(cellTexts[0]).toBe('History');
    expect(cellTexts[1]).toBe('history');
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

  it('should show an empty-state message when there are no categories', async () => {
    categories.set([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No categories yet');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('should navigate to edit route when edit button is clicked', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Edit category"]' }),
    );

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/categories/edit', 'c1']);
  });

  it('should navigate to bulk-edit route when bulk-edit button is clicked', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Bulk edit episodes in category"]' }),
    );

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/categories/bulk-edit', 'c1']);
  });

  it('should delete the category when delete is confirmed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Delete category"]' }),
    );

    await button.click();
    await fixture.whenStable();

    expect(mockCategoryStore.deleteCategory).toHaveBeenCalledWith('c1');
    vi.unstubAllGlobals();
  });

  it('should not delete the category when delete is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Delete category"]' }),
    );

    await button.click();
    await fixture.whenStable();

    expect(mockCategoryStore.deleteCategory).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
