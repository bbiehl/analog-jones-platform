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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCategoryStore: any;

  beforeEach(async () => {
    mockCategoryStore = {
      loading: vi.fn(() => false),
      error: vi.fn(() => null),
      categories: vi.fn(() => [
        { id: 'c1', name: 'History', slug: 'history' },
        { id: 'c2', name: 'Science', slug: 'science' },
      ]),
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
});
