import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
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

  it('should show a spinner and hide the form while loading', async () => {
    mockTagStore.loading = vi.fn(() => true);
    fixture = TestBed.createComponent(TagEdit);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    const spinners = await loader.getAllHarnesses(MatProgressSpinnerHarness);
    expect(spinners.length).toBe(1);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('should show the error message when the store has an error', async () => {
    mockTagStore.error = vi.fn(() => 'Boom');
    fixture = TestBed.createComponent(TagEdit);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    const errorEl = fixture.nativeElement.querySelector('.text-red-400');
    expect(errorEl?.textContent).toContain('Boom');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('should patch the form when selectedTag is available', async () => {
    mockTagStore.selectedTag = vi.fn(() => ({
      id: 't1',
      name: 'Featured',
      slug: 'featured',
    }));
    fixture = TestBed.createComponent(TagEdit);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(await inputs[0].getValue()).toBe('Featured');
    expect(await inputs[1].getValue()).toBe('featured');
  });

  it('should auto-generate a slug from the name on input', async () => {
    fixture.detectChanges();
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    const nameInput = inputs[0];

    await nameInput.setValue('Hard Rock & Roll!');
    expect(component['form'].controls.slug.value).toBe('hard-rock-roll');
  });

  it('should disable the Save button when the form is invalid', async () => {
    fixture.detectChanges();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('should not call updateTag when the form is invalid on submit', async () => {
    fixture.detectChanges();
    await component['onSubmit']();
    expect(mockTagStore.updateTag).not.toHaveBeenCalled();
  });

  it('should update the tag and navigate on successful submit', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['form'].setValue({ name: 'Vintage', slug: 'vintage' });
    fixture.detectChanges();

    await component['onSubmit']();

    expect(mockTagStore.updateTag).toHaveBeenCalledWith('t1', {
      name: 'Vintage',
      slug: 'vintage',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/tags']);
  });

  it('should not navigate when updateTag results in an error', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    mockTagStore.error = vi.fn(() => 'Failed to update');

    component['form'].setValue({ name: 'Vintage', slug: 'vintage' });
    fixture.detectChanges();

    await component['onSubmit']();

    expect(mockTagStore.updateTag).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
