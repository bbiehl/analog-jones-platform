import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { TagStore } from '@aj/core';
import { TagEdit } from './tag-edit';

describe('TagEdit', () => {
  let component: TagEdit;
  let fixture: ComponentFixture<TagEdit>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTagStore: any;

  beforeEach(async () => {
    mockTagStore = {
      loading: vi.fn(() => false),
      error: vi.fn(() => null),
      selectedTag: vi.fn(() => null),
      loadTagById: vi.fn(),
      updateTag: vi.fn().mockResolvedValue(undefined),
      clearSelectedTag: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TagEdit],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: TagStore, useValue: mockTagStore },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: 't1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TagEdit);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the tag by id on init', () => {
    expect(mockTagStore.loadTagById).toHaveBeenCalledWith('t1');
  });

  it('should display the "Edit Tag" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Edit Tag');
  });

  it('should have name and slug input fields', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(inputs.length).toBe(2);
  });

  it('should navigate to /tags on cancel', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: /Cancel/ }));

    await cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tags']);
  });

  it('should clear selected tag on destroy', () => {
    fixture.destroy();
    expect(mockTagStore.clearSelectedTag).toHaveBeenCalled();
  });
});
