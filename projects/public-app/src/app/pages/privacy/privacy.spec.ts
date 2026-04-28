import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Privacy } from './privacy';

describe('Privacy', () => {
  let component: Privacy;
  let fixture: ComponentFixture<Privacy>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Privacy],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Privacy);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the page heading', () => {
    const h1 = host.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Privacy Policy');
  });

  it('uses the page-frame wrapper for shared gutters', () => {
    const section = host.querySelector('section');
    expect(section?.classList.contains('page-frame')).toBe(true);
  });

  it('renders all top-level sections', () => {
    const headings = Array.from(host.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).toEqual([
      'About this policy',
      'No accounts, no personal data',
      'We will never sell your information',
      'Analytics, maybe someday',
      'Hosting and standard server logs',
      'Cookies',
      'Third-party platforms',
      'Changes to this policy',
      'Questions',
    ]);
  });

  it('states that there is no user registration', () => {
    expect(host.textContent).toContain('no user registration');
  });

  it('commits to never selling visitor information', () => {
    expect(host.textContent).toContain('never sell, rent, or trade visitor information');
  });

  it('notes that analytics may be added in the future to improve the experience', () => {
    expect(host.textContent).toContain('privacy-respecting analytics');
    expect(host.textContent).toContain('improve the experience');
  });

  it('links to the contact page via routerLink', () => {
    const contactLink = Array.from(host.querySelectorAll('a')).find(
      (a) => a.getAttribute('href') === '/contact',
    );
    expect(contactLink).toBeTruthy();
    expect(contactLink?.textContent?.trim()).toBe('contact page');
  });

  it('shows a last-updated date stamp', () => {
    expect(host.textContent).toMatch(/Last updated:/);
  });
});
