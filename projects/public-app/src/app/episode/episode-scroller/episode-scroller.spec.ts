import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Timestamp } from 'firebase/firestore';

import { Episode } from '@aj/core';
import { EpisodeScroller } from './episode-scroller';

function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  const date = new Date('2024-06-01T00:00:00Z');
  return {
    id: 'ep-1',
    title: 'Tape One',
    createdAt: Timestamp.fromDate(date),
    episodeDate: Timestamp.fromDate(date),
    intelligence: null,
    isVisible: true,
    links: {},
    categories: [],
    genres: [],
    tags: [],
    ...overrides,
  };
}

describe('EpisodeScroller', () => {
  let component: EpisodeScroller;
  let fixture: ComponentFixture<EpisodeScroller>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeScroller],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeScroller);
    component = fixture.componentInstance;
  });

  function setInputs(inputs: Record<string, unknown>) {
    for (const [k, v] of Object.entries(inputs)) {
      fixture.componentRef.setInput(k, v);
    }
  }

  it('should create', () => {
    setInputs({ episodes: [] });
    expect(component).toBeTruthy();
  });

  it('renders nothing when episodes is empty', () => {
    setInputs({ episodes: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('section')).toBeNull();
  });

  it('renders one .shelf-item per episode', () => {
    setInputs({
      episodes: [
        makeEpisode({ id: 'a', title: 'A' }),
        makeEpisode({ id: 'b', title: 'B' }),
        makeEpisode({ id: 'c', title: 'C' }),
      ],
    });
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.shelf-item');
    expect(items.length).toBe(3);
  });

  it('binds ariaLabel to the section', () => {
    setInputs({ episodes: [makeEpisode()], ariaLabel: 'Custom shelf' });
    fixture.detectChanges();
    const section: HTMLElement = fixture.nativeElement.querySelector('section');
    expect(section.getAttribute('aria-label')).toBe('Custom shelf');
  });

  it('omits .section-head when heading and seeAllLink are absent', () => {
    setInputs({ episodes: [makeEpisode()] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.section-head')).toBeNull();
  });

  it('renders heading, eyebrow, and default see-all label', () => {
    setInputs({
      episodes: [makeEpisode()],
      heading: 'Recently catalogued',
      eyebrow: '/ MUSEUM',
      seeAllLink: '/episodes',
    });
    fixture.detectChanges();
    const head = fixture.nativeElement.querySelector('.section-head');
    expect(head).not.toBeNull();
    expect(head.querySelector('h2 small').textContent.trim()).toBe('/ MUSEUM');
    expect(head.querySelector('h2').textContent).toContain('Recently catalogued');
    expect(head.querySelector('a.see-all').textContent.trim()).toBe('SEE ALL →');
  });

  it('uses seeAllLabel when provided', () => {
    setInputs({
      episodes: [makeEpisode()],
      heading: 'h',
      seeAllLink: '/episodes',
      seeAllLabel: 'BROWSE →',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a.see-all').textContent.trim()).toBe('BROWSE →');
  });

  it('routerPrefix flows into per-item href (default /episodes)', () => {
    setInputs({ episodes: [makeEpisode({ id: 'ep-42' })] });
    fixture.detectChanges();
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.shelf-item a');
    expect(anchor.getAttribute('href')).toBe('/episodes/ep-42');
  });

  it('routerPrefix flows into per-item href (custom)', () => {
    setInputs({ episodes: [makeEpisode({ id: 'ep-7' })], routerPrefix: '/archive' });
    fixture.detectChanges();
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.shelf-item a');
    expect(anchor.getAttribute('href')).toBe('/archive/ep-7');
  });

  describe('shelf item', () => {
    it('renders each episode as a text card with no poster frame', () => {
      setInputs({ episodes: [makeEpisode({ id: 'p', title: 'Tape 99' })] });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.poster')).toBeNull();
      expect(fixture.nativeElement.querySelector('.shelf-item .name').textContent).toContain(
        'Tape 99',
      );
    });

    it('gives the shelf-item link an accessible name from the episode title', () => {
      setInputs({ episodes: [makeEpisode({ title: 'Tape 99' })] });
      fixture.detectChanges();
      const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.shelf-item a');
      expect(anchor.getAttribute('aria-label')).toBe('Tape 99');
    });
  });

  it('toDate returns the JS Date from the Timestamp', () => {
    setInputs({ episodes: [] });
    const date = new Date('2020-01-02T03:04:05Z');
    const ep = makeEpisode({ episodeDate: Timestamp.fromDate(date) });
    expect(component['toDate'](ep).toISOString()).toBe(date.toISOString());
  });
});
