import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { TagStore } from '@aj/core';
import { Tags } from './tags';

describe('Tags', () => {
  let component: Tags;
  let fixture: ComponentFixture<Tags>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTagStore: any;

  beforeEach(async () => {
    mockTagStore = {
      loading: vi.fn(() => false),
      error: vi.fn(() => null),
      tags: vi.fn(() => [
        { id: 't1', name: 'Featured', slug: 'featured' },
        { id: 't2', name: 'New', slug: 'new' },
      ]),
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
});
