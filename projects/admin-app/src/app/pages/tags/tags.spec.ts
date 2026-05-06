import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { TagStore } from '@aj/core';
import { Tags } from './tags';

describe('Tags', () => {
  let component: Tags;
  let fixture: ComponentFixture<Tags>;
  let loader: HarnessLoader;
  let loading: ReturnType<typeof signal<boolean>>;
  let error: ReturnType<typeof signal<string | null>>;
  let tags: ReturnType<typeof signal<{ id: string; name: string; slug: string }[]>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTagStore: any;

  beforeEach(async () => {
    loading = signal(false);
    error = signal<string | null>(null);
    tags = signal([
      { id: 't1', name: 'Featured', slug: 'featured' },
      { id: 't2', name: 'New', slug: 'new' },
    ]);
    mockTagStore = {
      loading,
      error,
      tags,
      loadTags: vi.fn(),
      deleteTag: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Tags],
      providers: [
        provideRouter([]),
        { provide: TagStore, useValue: mockTagStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tags);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tags on init', () => {
    expect(mockTagStore.loadTags).toHaveBeenCalled();
  });

  it('should display the "Tags" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Tags');
  });

  it('should have an "Add Tag" button', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Tag/ }));
    expect(button).toBeTruthy();
  });

  it('should navigate to /tags/add on add button click', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Tag/ }));

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tags/add']);
  });

  it('should display tags in a table', async () => {
    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    expect(rows.length).toBe(2);
  });

  it('should display tag data in the table', async () => {
    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    const firstRowCells = await rows[0].getCells();
    const cellTexts = await Promise.all(firstRowCells.map((c) => c.getText()));
    expect(cellTexts[0]).toBe('Featured');
    expect(cellTexts[1]).toBe('featured');
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

  it('should show an empty-state message when there are no tags', async () => {
    tags.set([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No tags yet');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('should navigate to edit route when edit button is clicked', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Edit tag"]' }),
    );

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tags/edit', 't1']);
  });

  it('should navigate to bulk-edit route when bulk-edit button is clicked', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Bulk edit episodes in tag"]' }),
    );

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tags/bulk-edit', 't1']);
  });

  it('should delete the tag when delete is confirmed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Delete tag"]' }),
    );

    await button.click();
    await fixture.whenStable();

    expect(mockTagStore.deleteTag).toHaveBeenCalledWith('t1');
    vi.unstubAllGlobals();
  });

  it('should not delete the tag when delete is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Delete tag"]' }),
    );

    await button.click();
    await fixture.whenStable();

    expect(mockTagStore.deleteTag).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('should filter rows by name', async () => {
    const input = await loader.getHarness(MatInputHarness);
    await input.setValue('feat');
    fixture.detectChanges();
    await fixture.whenStable();

    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    expect(rows.length).toBe(1);
    const cells = await rows[0].getCells();
    expect(await cells[0].getText()).toBe('Featured');
  });

  it('should filter rows by slug case-insensitively', async () => {
    const input = await loader.getHarness(MatInputHarness);
    await input.setValue('NEW');
    fixture.detectChanges();
    await fixture.whenStable();

    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    expect(rows.length).toBe(1);
    const cells = await rows[0].getCells();
    expect(await cells[1].getText()).toBe('new');
  });

  it('should show no-data row when filter matches nothing', async () => {
    const input = await loader.getHarness(MatInputHarness);
    await input.setValue('zzz-nothing');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No tags match "zzz-nothing"');
  });

  it('should show clear-filter button only when filter has a value', async () => {
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Clear filter"]'),
    ).toBeNull();

    const input = await loader.getHarness(MatInputHarness);
    await input.setValue('feat');
    fixture.detectChanges();
    await fixture.whenStable();

    const clearBtn = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Clear filter"]' }),
    );
    await clearBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    expect(rows.length).toBe(2);
  });

  it('should sort by name using the case-insensitive sortingDataAccessor', () => {
    const dataSource = (component as unknown as { dataSource: { sortingDataAccessor: (t: { name: string; slug: string }, header: string) => string } }).dataSource;
    expect(dataSource.sortingDataAccessor({ name: 'ZED', slug: 'zed' }, 'name')).toBe('zed');
    expect(dataSource.sortingDataAccessor({ name: 'ZED', slug: 'SLUG' }, 'slug')).toBe('slug');
    expect(dataSource.sortingDataAccessor({ name: 'ZED', slug: 'zed' }, 'unknown')).toBe('');
  });

  it('should reset paginator to first page when filter applied', async () => {
    const input = await loader.getHarness(MatInputHarness);
    // dataSource has a paginator wired via effect; spy on firstPage
    const dataSource = (component as unknown as { dataSource: { paginator: { firstPage: () => void } | null } }).dataSource;
    expect(dataSource.paginator).toBeTruthy();
    const firstPageSpy = vi.spyOn(dataSource.paginator!, 'firstPage');

    await input.setValue('feat');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(firstPageSpy).toHaveBeenCalled();
  });
});
