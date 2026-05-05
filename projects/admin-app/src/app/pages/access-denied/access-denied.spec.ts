import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatIconHarness } from '@angular/material/icon/testing';
import { UserStore } from '@aj/core';
import { AccessDenied } from './access-denied';

describe('AccessDenied', () => {
  let component: AccessDenied;
  let fixture: ComponentFixture<AccessDenied>;
  let loader: HarnessLoader;
  let mockUserStore: { signOut: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    mockUserStore = { signOut: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [AccessDenied],
      providers: [
        provideRouter([]),
        { provide: UserStore, useValue: mockUserStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessDenied);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the "Access Denied" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Access Denied');
  });

  it('should display the access denied message', () => {
    const p = fixture.nativeElement.querySelector('p');
    expect(p.textContent).toContain('Your account does not have admin access.');
  });

  it('should display the block icon', async () => {
    const icon = await loader.getHarness(MatIconHarness.with({ name: 'block' }));
    expect(icon).toBeTruthy();
  });

  it('should have a sign out button with logout icon', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Sign out/ }));
    expect(button).toBeTruthy();

    const icon = await loader.getHarness(MatIconHarness.with({ name: 'logout' }));
    expect(icon).toBeTruthy();
  });

  it('should call userStore.signOut and navigate to /login when sign out is clicked', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Sign out/ }));

    await button.click();

    expect(mockUserStore.signOut).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
