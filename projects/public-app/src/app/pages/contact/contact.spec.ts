import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contact } from './contact';

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
    }).compileComponents();

    fixture = TestBed.createComponent(Contact);
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
    expect(h1?.textContent?.trim()).toBe('Contact');
  });

  it('uses the page-frame wrapper for shared gutters', () => {
    const section = host.querySelector('section');
    expect(section?.classList.contains('page-frame')).toBe(true);
  });

  it('renders the top-level sections', () => {
    const headings = Array.from(host.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).toEqual(['Email', 'Where to find us']);
  });

  it('lists all host email addresses as mailto links with a subject', () => {
    const mailtoLinks = Array.from(host.querySelectorAll('a[href^="mailto:"]')).map((a) =>
      a.getAttribute('href'),
    );
    expect(mailtoLinks).toEqual([
      'mailto:bradley.biehl@gmail.com?subject=Analog%20Jones',
      'mailto:stephen.bay00@gmail.com?subject=Analog%20Jones',
      'mailto:CMRobinson2@gmail.com?subject=Analog%20Jones',
    ]);
  });

  it('renders external platform links with target=_blank and rel=noopener', () => {
    const externalLinks = Array.from(
      host.querySelectorAll('a[target="_blank"]'),
    ) as HTMLAnchorElement[];
    expect(externalLinks.length).toBe(4);
    for (const link of externalLinks) {
      expect(link.getAttribute('rel')).toBe('noopener');
    }
  });

  it('links to Spotify, YouTube, Facebook, and GitHub', () => {
    const hrefs = Array.from(host.querySelectorAll('a[target="_blank"]')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs.some((h) => h?.includes('open.spotify.com'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('youtube.com'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('facebook.com'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('github.com'))).toBe(true);
  });
});
