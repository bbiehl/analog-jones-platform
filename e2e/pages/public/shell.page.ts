import { Locator, Page } from '@playwright/test';

/**
 * The public-app shell: top toolbar nav (desktop), end-positioned sidenav
 * (mobile / Handset breakpoint), and the sticky footer.
 */
export class PublicShellPage {
  readonly toolbarNav: Locator;
  readonly footerNav: Locator;
  readonly hamburger: Locator;
  readonly sidenav: Locator;

  constructor(private readonly page: Page) {
    this.toolbarNav = page.getByRole('navigation', { name: 'Main navigation' });
    this.footerNav = page.getByRole('navigation', { name: 'Footer navigation' });
    this.hamburger = page.getByRole('button', { name: 'Toggle navigation menu' });
    this.sidenav = page.getByRole('navigation', { name: 'Side navigation' });
  }

  // Toolbar / sidenav links carry a decorative "/" prefix in their accessible
  // name (e.g. "/ Episodes"), so match the label as a substring rather than exact.

  /** A top-nav link by its visible label (desktop). */
  toolbarLink(label: string): Locator {
    return this.toolbarNav.getByRole('link', { name: label });
  }

  /** A footer link by its visible label (footer names have no prefix). */
  footerLink(label: string): Locator {
    return this.footerNav.getByRole('link', { name: label, exact: true });
  }

  /** A link inside the mobile sidenav by its visible label. */
  sidenavLink(label: string): Locator {
    return this.sidenav.getByRole('link', { name: label });
  }

  async openSidenav(): Promise<void> {
    await this.hamburger.click();
  }
}
