import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatIconHarness } from '@angular/material/icon/testing';
import { UserStore } from '../../../../../../libs/user/user.store';
import { Shell } from './shell';

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockUserStore: any;
  let router: Router;

  beforeEach(async () => {
    mockUserStore = {
      user: vi.fn(() => ({ email: 'admin@test.com' })),
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        { provide: UserStore, useValue: mockUserStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the "Admin" brand text', () => {
    const brand = fixture.nativeElement.querySelector('.toolbar-brand');
    expect(brand.textContent).toContain('Admin');
  });

  it('should display navigation links on desktop', () => {
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav.textContent).toContain('Dashboard');
    expect(nav.textContent).toContain('Episodes');
  });

  it('should have a sign out button', async () => {
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Sign out"]' })
    );
    expect(button).toBeTruthy();
  });

  it('should call userStore.signOut and navigate to /login on sign out', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Sign out"]' })
    );

    await button.click();

    expect(mockUserStore.signOut).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should display the user email', () => {
    const email = fixture.nativeElement.querySelector('.text-gray-400');
    expect(email.textContent).toContain('admin@test.com');
  });
});
