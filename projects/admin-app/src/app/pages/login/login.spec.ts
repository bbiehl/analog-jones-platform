import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { UserStore } from '../../../../../../libs/user/user.store';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockUserStore: any;

  beforeEach(async () => {
    mockUserStore = {
      loading: vi.fn(() => false),
      error: vi.fn(() => null),
      authReady: vi.fn(() => true),
      isAdmin: vi.fn(() => false),
      signIn: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: UserStore, useValue: mockUserStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the "Admin" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Admin');
  });

  it('should display the sign in prompt', () => {
    const p = fixture.nativeElement.querySelector('p');
    expect(p.textContent).toContain('Sign in to manage content');
  });

  it('should have a sign in button when not loading', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Sign in with Google/ }));
    expect(button).toBeTruthy();
  });

  it('should navigate to /access-denied for non-admin after sign in', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Sign in with Google/ }));

    await button.click();

    expect(mockUserStore.signIn).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/access-denied']);
  });

  it('should navigate to /dashboard for admin after sign in', async () => {
    mockUserStore.isAdmin.mockReturnValue(true);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Sign in with Google/ }));

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});
