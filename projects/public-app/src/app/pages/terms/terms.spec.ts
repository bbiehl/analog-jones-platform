import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Terms } from './terms';

describe('Terms', () => {
  let component: Terms;
  let fixture: ComponentFixture<Terms>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Terms],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Terms);
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
    expect(h1?.textContent?.trim()).toBe('Terms of Use');
  });

  it('uses the page-frame wrapper for shared gutters', () => {
    const section = host.querySelector('section');
    expect(section?.classList.contains('page-frame')).toBe(true);
  });

  it('renders all top-level sections', () => {
    const headings = Array.from(host.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).toEqual([
      'About this site',
      'No accounts, no sign-up',
      'Sharing is encouraged',
      "Please don't pirate the show",
      'Third-party platforms',
      'As-is, and subject to change',
      'Questions',
    ]);
  });

  it('states that there is no user registration', () => {
    expect(host.textContent).toContain("don't offer user registration");
  });

  it('encourages sharing', () => {
    const sharing = Array.from(host.querySelectorAll('h2')).find(
      (h) => h.textContent?.trim() === 'Sharing is encouraged',
    );
    expect(sharing).toBeTruthy();
  });

  it('asks users not to pirate the show', () => {
    expect(host.textContent).toContain("Please don't pirate the show");
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
