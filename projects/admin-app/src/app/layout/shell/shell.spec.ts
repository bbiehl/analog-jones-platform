import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSidenavHarness } from '@angular/material/sidenav/testing';
import { BehaviorSubject } from 'rxjs';
import { UserStore } from '@aj/core';
import { Shell } from './shell';

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockUserStore: any;
  let router: Router;
  let breakpointSubject: BehaviorSubject<BreakpointState>;
  let userSignal: ReturnType<typeof signal<{ email: string } | null>>;

  const createFixture = async (isMobile = false) => {
    breakpointSubject = new BehaviorSubject<BreakpointState>({
      matches: isMobile,
      breakpoints: {},
    });

    userSignal = signal<{ email: string } | null>({ email: 'admin@test.com' });
    mockUserStore = {
      user: userSignal,
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: UserStore, useValue: mockUserStore },
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () => breakpointSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  describe('desktop', () => {
    beforeEach(async () => {
      await createFixture(false);
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display the "Admin" brand text', () => {
      const brand = fixture.nativeElement.querySelector('.toolbar-brand');
      expect(brand.textContent).toContain('Admin');
    });

    it('should render all configured navigation links in the toolbar', () => {
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav).toBeTruthy();
      const links = nav.querySelectorAll('a');
      expect(links.length).toBe(6);
      ['Dashboard', 'Users', 'Episodes', 'Categories', 'Genres', 'Tags'].forEach((label) => {
        expect(nav.textContent).toContain(label);
      });
    });

    it('should not render the mobile sidenav or hamburger button', async () => {
      const sidenavs = await loader.getAllHarnesses(MatSidenavHarness);
      expect(sidenavs.length).toBe(0);
      const menuButtons = await loader.getAllHarnesses(
        MatButtonHarness.with({ selector: '[aria-label="Toggle navigation menu"]' }),
      );
      expect(menuButtons.length).toBe(0);
    });

    it('should display the user email in the toolbar', () => {
      const email = fixture.nativeElement.querySelector('.text-gray-400');
      expect(email.textContent).toContain('admin@test.com');
    });

    it('should expose a sign out button', async () => {
      const button = await loader.getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Sign out"]' }),
      );
      expect(button).toBeTruthy();
    });

    it('should call userStore.signOut and navigate to /login on sign out', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const button = await loader.getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Sign out"]' }),
      );

      await button.click();

      expect(mockUserStore.signOut).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('should hide user email and sign out button when no user is signed in', async () => {
      userSignal.set(null);
      fixture.detectChanges();

      const email = fixture.nativeElement.querySelector('.text-gray-400');
      expect(email).toBeNull();
      const signOutButtons = await loader.getAllHarnesses(
        MatButtonHarness.with({ selector: '[aria-label="Sign out"]' }),
      );
      expect(signOutButtons.length).toBe(0);
    });

    it('should switch to mobile layout when the breakpoint matches', async () => {
      breakpointSubject.next({ matches: true, breakpoints: {} });
      fixture.detectChanges();
      await fixture.whenStable();

      const toolbarNav = fixture.nativeElement.querySelector('nav.toolbar-nav');
      expect(toolbarNav).toBeNull();
      const sidenav = await loader.getHarness(MatSidenavHarness);
      expect(sidenav).toBeTruthy();
    });
  });

  describe('mobile', () => {
    beforeEach(async () => {
      await createFixture(true);
    });

    it('should hide the desktop toolbar nav', () => {
      const toolbarNav = fixture.nativeElement.querySelector('nav.toolbar-nav');
      expect(toolbarNav).toBeNull();
    });

    it('should hide the user email in the toolbar', () => {
      const email = fixture.nativeElement.querySelector('.text-gray-400');
      expect(email).toBeNull();
    });

    it('should render the end-positioned sidenav with nav links and sign out', async () => {
      const sidenav = await loader.getHarness(MatSidenavHarness);
      expect(await sidenav.getPosition()).toBe('end');
      expect(await sidenav.getMode()).toBe('over');

      const allItems = fixture.nativeElement.querySelectorAll('mat-nav-list a');
      expect(allItems.length).toBe(7);
      const navLinks = Array.from(allItems).filter((el) => (el as HTMLElement).hasAttribute('href'));
      expect(navLinks.length).toBe(6);
      const signOutHrefs = Array.from(allItems).filter(
        (el) => !(el as HTMLElement).hasAttribute('href'),
      );
      expect(signOutHrefs.length).toBe(1);
      expect((signOutHrefs[0] as HTMLElement).textContent).toContain('Sign out');
    });

    it('should open the sidenav when the hamburger button is clicked', async () => {
      const menuButton = await loader.getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Toggle navigation menu"]' }),
      );
      const sidenav = await loader.getHarness(MatSidenavHarness);

      expect(await sidenav.isOpen()).toBe(false);
      await menuButton.click();
      expect(await sidenav.isOpen()).toBe(true);
    });

    it('should close the sidenav when a nav link is activated', async () => {
      const menuButton = await loader.getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Toggle navigation menu"]' }),
      );
      await menuButton.click();
      const sidenav = await loader.getHarness(MatSidenavHarness);
      expect(await sidenav.isOpen()).toBe(true);

      const firstLink = fixture.nativeElement.querySelector('mat-nav-list a[mat-list-item]');
      firstLink.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(await sidenav.isOpen()).toBe(false);
    });

    it('should sign out via the sidenav sign-out list item', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const menuButton = await loader.getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Toggle navigation menu"]' }),
      );
      await menuButton.click();

      const items = fixture.nativeElement.querySelectorAll('mat-nav-list a');
      const signOutItem = items[items.length - 1] as HTMLElement;
      expect(signOutItem.textContent).toContain('Sign out');
      signOutItem.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockUserStore.signOut).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
