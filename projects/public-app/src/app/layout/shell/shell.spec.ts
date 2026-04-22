import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSidenavHarness } from '@angular/material/sidenav/testing';
import { BehaviorSubject } from 'rxjs';
import { Shell } from './shell';

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;
  let loader: HarnessLoader;
  let breakpointSubject: BehaviorSubject<BreakpointState>;

  const createFixture = async (isMobile = false) => {
    breakpointSubject = new BehaviorSubject<BreakpointState>({
      matches: isMobile,
      breakpoints: {},
    });

    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
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

    it('should render the toolbar logo linking home with an accessible label', () => {
      const logo = fixture.nativeElement.querySelector('a.toolbar-logo');
      expect(logo).toBeTruthy();
      expect(logo.getAttribute('aria-label')).toBe('Analog Jones home');
      const img = logo.querySelector('img');
      expect(img).toBeTruthy();
      expect(img.getAttribute('alt')).toBe('Analog Jones');
    });

    it('should render all configured navigation links in the toolbar', () => {
      const nav = fixture.nativeElement.querySelector('nav.toolbar-nav');
      expect(nav).toBeTruthy();
      const links = nav.querySelectorAll('a');
      expect(links.length).toBe(3);
      ['Home', 'Episodes', 'Explorer'].forEach((label) => {
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

    it('should render the footer with all footer links and the current year', () => {
      const footer = fixture.nativeElement.querySelector('footer');
      expect(footer).toBeTruthy();
      expect(footer.getAttribute('role')).toBe('contentinfo');

      const footerNav = footer.querySelector('nav');
      const links = footerNav.querySelectorAll('a');
      expect(links.length).toBe(6);
      ['Home', 'Episodes', 'Explorer', 'Contact', 'Terms of Use', 'Privacy Policy'].forEach(
        (label) => {
          expect(footerNav.textContent).toContain(label);
        },
      );

      const copyright = footer.querySelector('p');
      expect(copyright.textContent).toContain(String(new Date().getFullYear()));
      expect(copyright.textContent).toContain('Analog Jones');
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

    it('should render the end-positioned sidenav with all nav links', async () => {
      const sidenav = await loader.getHarness(MatSidenavHarness);
      expect(await sidenav.getPosition()).toBe('end');
      expect(await sidenav.getMode()).toBe('over');

      const items = fixture.nativeElement.querySelectorAll('mat-nav-list a');
      expect(items.length).toBe(3);
      ['Home', 'Episodes', 'Explorer'].forEach((label) => {
        expect(Array.from(items).some((el) => (el as HTMLElement).textContent?.includes(label)))
          .toBe(true);
      });
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
  });
});
