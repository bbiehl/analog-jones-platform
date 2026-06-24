import { ComponentFixture, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Timestamp } from 'firebase/firestore';

import { Episode } from '@aj/core';
import { EpisodeGrid } from './episode-grid';

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

describe('EpisodeGrid', () => {
  let component: EpisodeGrid;
  let fixture: ComponentFixture<EpisodeGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeGrid],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeGrid);
    component = fixture.componentInstance;
  });

  function setInputs(inputs: Record<string, unknown>) {
    for (const [k, v] of Object.entries(inputs)) {
      fixture.componentRef.setInput(k, v);
    }
  }

  // Cards live in per-card `@defer (hydrate on viewport)` blocks: server-rendered
  // in prod, but dehydrated in the test environment. Force them to their complete
  // state so the card markup is queryable.
  async function renderCards() {
    fixture.detectChanges();
    const blocks = await fixture.getDeferBlocks();
    for (const block of blocks) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one .card per episode', async () => {
    setInputs({
      episodes: [
        makeEpisode({ id: 'a', title: 'A' }),
        makeEpisode({ id: 'b', title: 'B' }),
        makeEpisode({ id: 'c', title: 'C' }),
      ],
    });
    await renderCards();
    const cards = fixture.nativeElement.querySelectorAll('.card:not(.card--skeleton)');
    expect(cards.length).toBe(3);
  });

  it('binds ariaLabel to the grid', () => {
    setInputs({ episodes: [makeEpisode()], ariaLabel: 'Custom grid' });
    fixture.detectChanges();
    const grid: HTMLElement = fixture.nativeElement.querySelector('.episode-grid');
    expect(grid.getAttribute('aria-label')).toBe('Custom grid');
  });

  it('omits the heading when none is provided', () => {
    setInputs({ episodes: [makeEpisode()] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.grid-heading')).toBeNull();
  });

  it('renders the heading when provided', () => {
    setInputs({ episodes: [makeEpisode()], heading: 'Action' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.grid-heading').textContent).toContain('Action');
  });

  it('routerPrefix flows into per-item href (default /episodes)', async () => {
    setInputs({ episodes: [makeEpisode({ id: 'ep-42' })] });
    await renderCards();
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.card a');
    expect(anchor.getAttribute('href')).toBe('/episodes/ep-42');
  });

  it('routerPrefix flows into per-item href (custom)', async () => {
    setInputs({ episodes: [makeEpisode({ id: 'ep-7' })], routerPrefix: '/archive' });
    await renderCards();
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.card a');
    expect(anchor.getAttribute('href')).toBe('/archive/ep-7');
  });

  it('gives the card link an accessible name from the episode title', async () => {
    setInputs({ episodes: [makeEpisode({ title: 'Tape 99' })] });
    await renderCards();
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.card a');
    expect(anchor.getAttribute('aria-label')).toBe('Tape 99');
  });

  describe('loading', () => {
    it('renders skeleton cards and marks the grid aria-busy', () => {
      setInputs({ loading: true });
      fixture.detectChanges();
      const grid: HTMLElement = fixture.nativeElement.querySelector('.episode-grid');
      expect(grid.getAttribute('aria-busy')).toBe('true');
      expect(fixture.nativeElement.querySelectorAll('.card--skeleton').length).toBeGreaterThan(0);
    });

    it('does not render episode cards while loading', () => {
      setInputs({ loading: true, episodes: [makeEpisode()] });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.card:not(.card--skeleton)')).toBeNull();
    });

    it('omits aria-busy when not loading', () => {
      setInputs({ episodes: [makeEpisode()] });
      fixture.detectChanges();
      const grid: HTMLElement = fixture.nativeElement.querySelector('.episode-grid');
      expect(grid.getAttribute('aria-busy')).toBeNull();
    });
  });

  it('toDate returns the JS Date from the Timestamp', () => {
    const date = new Date('2020-01-02T03:04:05Z');
    const ep = makeEpisode({ episodeDate: Timestamp.fromDate(date) });
    expect(component['toDate'](ep).toISOString()).toBe(date.toISOString());
  });
});
