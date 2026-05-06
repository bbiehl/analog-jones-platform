import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { TagStore } from '@aj/core';
import { TagAdd } from './tag-add';

describe('TagAdd', () => {
  let component: TagAdd;
  let fixture: ComponentFixture<TagAdd>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTagStore: any;

  beforeEach(async () => {
    mockTagStore = {
      createTag: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(() => null),
    };

    await TestBed.configureTestingModule({
      imports: [TagAdd],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: TagStore, useValue: mockTagStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TagAdd);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the "Add Tag" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Add Tag');
  });

  it('should have name and slug input fields', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(inputs.length).toBe(2);
  });

  it('should have the save button disabled when form is empty', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('should navigate to /tags on cancel', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: /Cancel/ }));

    await cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tags']);
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

  it('should create the tag and navigate on submit', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('My Tag');
    await inputs[1].setValue('my-tag');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    expect(await saveButton.isDisabled()).toBe(false);
    await saveButton.click();
    await fixture.whenStable();

    expect(mockTagStore.createTag).toHaveBeenCalledWith({
      name: 'My Tag',
      slug: 'my-tag',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/tags']);
  });

  it('should not create or navigate when form is invalid', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component['onSubmit']();

    expect(mockTagStore.createTag).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should not navigate when the store reports an error after submit', async () => {
    mockTagStore.error = vi.fn(() => 'boom');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('My Tag');
    await inputs[1].setValue('my-tag');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: /Save/ }));
    await saveButton.click();
    await fixture.whenStable();

    expect(mockTagStore.createTag).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should not navigate when createTag rejects', async () => {
    mockTagStore.createTag = vi.fn().mockRejectedValue(new Error('fail'));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await inputs[0].setValue('My Tag');
    await inputs[1].setValue('my-tag');

    await expect(component['onSubmit']()).rejects.toThrow('fail');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
