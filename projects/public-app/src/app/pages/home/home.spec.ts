import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Timestamp } from 'firebase/firestore';

import { Episode, EpisodeWithRelations } from '../../../../../../libs/episode/episode.model';
import { EpisodeStore } from '../../../../../../libs/episode/episode.store';
import { EpisodeScroller } from '../../episode/episode-scroller/episode-scroller';
import { Home } from './home';

interface MockStore {
  episodes: WritableSignal<Episode[]>;
  currentEpisode: WritableSignal<Episode | null>;
  recentEpisodes: WritableSignal<Episode[]>;
  selectedEpisode: WritableSignal<EpisodeWithRelations | null>;
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  loadVisibleEpisodes: ReturnType<typeof vi.fn>;
  loadEpisodeById: ReturnType<typeof vi.fn>;
}

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
    posterUrl: null,
    ...overrides,
  };
}

function makeRelations(ep: Episode, overrides: Partial<EpisodeWithRelations> = {}): EpisodeWithRelations {
  return {
    ...ep,
    categories: [],
    genres: [],
    tags: [],
    ...overrides,
  };
}

async function setup(initial: Partial<MockStore> = {}): Promise<{
  fixture: ComponentFixture<Home>;
  component: Home;
  store: MockStore;
}> {
  const store: MockStore = {
    episodes: signal<Episode[]>([]),
    currentEpisode: signal<Episode | null>(null),
    recentEpisodes: signal<Episode[]>([]),
    selectedEpisode: signal<EpisodeWithRelations | null>(null),
    loading: signal(false),
    error: signal<string | null>(null),
    loadVisibleEpisodes: vi.fn().mockResolvedValue(undefined),
    loadEpisodeById: vi.fn().mockResolvedValue(undefined),
    ...initial,
  };

  await TestBed.configureTestingModule({
    imports: [Home],
    providers: [provideRouter([]), { provide: EpisodeStore, useValue: store }],
  }).compileComponents();

  const fixture = TestBed.createComponent(Home);
  const component = fixture.componentInstance;
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, component, store };
}

describe('Home', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  describe('derivations', () => {
    it('featured is the first episode, shelfEpisodes is items 1..8', async () => {
      const eps = Array.from({ length: 10 }, (_, i) =>
        makeEpisode({ id: `ep-${i}`, title: `t${i}` })
      );
      const { component } = await setup({ episodes: signal(eps) });
      expect(component['featured']()?.id).toBe('ep-0');
      expect(component['shelfEpisodes']().length).toBe(8);
      expect(component['shelfEpisodes']()[0].id).toBe('ep-1');
      expect(component['shelfEpisodes']()[7].id).toBe('ep-8');
    });

    it('featured is null when list is empty', async () => {
      const { component, fixture } = await setup();
      expect(component['featured']()).toBeNull();
      expect(fixture.nativeElement.querySelector('.monitor')).toBeNull();
      expect(fixture.nativeElement.querySelector('#drop')).toBeNull();
    });
  });

  describe('pad', () => {
    it('pads to width 2', async () => {
      const { component } = await setup();
      expect(component['pad'](2, 2)).toBe('02');
    });

    it('defaults to width 3', async () => {
      const { component } = await setup();
      expect(component['pad'](2)).toBe('002');
    });
  });

  describe('tapeCounter', () => {
    it('formats zero as 00:00:00', async () => {
      const { component } = await setup();
      expect(component['tapeCounter']()).toBe('00:00:00');
    });

    it('formats 3661s as 01:01:01', async () => {
      const { component } = await setup();
      component['tapeSeconds'].set(3661);
      expect(component['tapeCounter']()).toBe('01:01:01');
    });
  });

  describe('ngOnInit wiring', () => {
    it('calls loadVisibleEpisodes and loadEpisodeById with featured id when episodes present', async () => {
      const ep = makeEpisode({ id: 'feat-1' });
      const { store } = await setup({ episodes: signal([ep]) });
      expect(store.loadVisibleEpisodes).toHaveBeenCalledTimes(1);
      expect(store.loadEpisodeById).toHaveBeenCalledWith('feat-1');
    });

    it('does not call loadEpisodeById when episodes is empty', async () => {
      const { store } = await setup();
      expect(store.loadVisibleEpisodes).toHaveBeenCalledTimes(1);
      expect(store.loadEpisodeById).not.toHaveBeenCalled();
    });
  });

  describe('featuredDetails', () => {
    it('returns selectedEpisode when its id matches the featured id', async () => {
      const ep = makeEpisode({ id: 'match' });
      const selected = makeRelations(ep);
      const { component } = await setup({
        episodes: signal([ep]),
        selectedEpisode: signal(selected),
      });
      expect(component['featuredDetails']()?.id).toBe('match');
    });

    it('returns null when selectedEpisode id differs from featured', async () => {
      const ep = makeEpisode({ id: 'feat' });
      const other = makeRelations(makeEpisode({ id: 'other' }));
      const { component } = await setup({
        episodes: signal([ep]),
        selectedEpisode: signal(other),
      });
      expect(component['featuredDetails']()).toBeNull();
    });
  });

  describe('featuredIntelligence', () => {
    it('is null when featured.intelligence is null', async () => {
      const { component } = await setup({ episodes: signal([makeEpisode({ intelligence: null })]) });
      expect(component['featuredIntelligence']()).toBeNull();
    });

    it('renders markdown and trims long strings with an ellipsis', async () => {
      const long = 'word '.repeat(400);
      const ep = makeEpisode({ intelligence: long });
      const { component } = await setup({ episodes: signal([ep]) });
      const rendered = component['featuredIntelligence']() as string;
      expect(rendered).toContain('…');
      expect(rendered.trim().startsWith('<p>')).toBe(true);
    });

    it('leaves short markdown unchanged (no ellipsis)', async () => {
      const ep = makeEpisode({ intelligence: '**hello** world' });
      const { component } = await setup({ episodes: signal([ep]) });
      const rendered = component['featuredIntelligence']() as string;
      expect(rendered).toContain('<strong>hello</strong>');
      expect(rendered).not.toContain('…');
    });
  });

  describe('posterBg / posterColor / monitorGlow', () => {
    it('posterBg uses url() when posterUrl is set', async () => {
      const { component } = await setup();
      const ep = makeEpisode({ posterUrl: 'https://cdn/p.jpg' });
      const bg = component['posterBg'](ep);
      expect(bg).toContain("url('https://cdn/p.jpg')");
      expect(bg).toContain('#050509');
    });

    it('posterBg falls back to gradient when posterUrl is null', async () => {
      const { component } = await setup();
      const bg = component['posterBg'](makeEpisode({ posterUrl: null }));
      expect(bg).toContain('linear-gradient');
      expect(bg).toContain('repeating-linear-gradient');
    });

    it('posterColor is deterministic and well-formed', async () => {
      const { component } = await setup();
      const a = component['posterColor'](makeEpisode({ id: 'k' }));
      const b = component['posterColor'](makeEpisode({ id: 'k', title: 'x' }));
      expect(a).toBe(b);
      expect(a).toMatch(/^hsl\(\d{1,3}, 55%, 42%\)$/);
    });

    it('monitorGlow contains two radial-gradient stops', async () => {
      const { component } = await setup();
      const glow = component['monitorGlow'](makeEpisode());
      expect(glow.match(/radial-gradient/g)?.length).toBe(2);
    });
  });

  describe('Drop section template', () => {
    it('renders date + category + genre chips when featuredDetails matches', async () => {
      const ep = makeEpisode({ id: 'drop' });
      const selected = makeRelations(ep, {
        categories: [
          { id: 'c1', name: 'Horror', slug: 'horror' },
          { id: 'c2', name: 'Sci-Fi', slug: 'sci-fi' },
        ] as EpisodeWithRelations['categories'],
        genres: [{ id: 'g1', name: 'Cult', slug: 'cult' }] as EpisodeWithRelations['genres'],
      });
      const { fixture } = await setup({
        episodes: signal([ep]),
        selectedEpisode: signal(selected),
      });
      const chips = fixture.nativeElement.querySelectorAll('.meta-row .chip');
      expect(chips.length).toBe(4);
    });

    it('renders only the date chip when no matching selected episode', async () => {
      const { fixture } = await setup({ episodes: signal([makeEpisode()]) });
      const chips = fixture.nativeElement.querySelectorAll('.meta-row .chip');
      expect(chips.length).toBe(1);
    });

    it('shows spotify CTA only when present in links', async () => {
      const ep = makeEpisode({ links: { spotify: 'https://spotify/ep' } });
      const { fixture } = await setup({ episodes: signal([ep]) });
      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('#drop .actions a')
      ) as HTMLAnchorElement[];
      expect(buttons.some((b) => b.textContent?.includes('SPOTIFY'))).toBe(true);
      expect(buttons.some((b) => b.textContent?.includes('YOUTUBE'))).toBe(false);
    });

    it('shows youtube CTA only when present in links', async () => {
      const ep = makeEpisode({ links: { youtube: 'https://yt/ep' } });
      const { fixture } = await setup({ episodes: signal([ep]) });
      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('#drop .actions a')
      ) as HTMLAnchorElement[];
      expect(buttons.some((b) => b.textContent?.includes('YOUTUBE'))).toBe(true);
      expect(buttons.some((b) => b.textContent?.includes('SPOTIFY'))).toBe(false);
    });
  });

  it('passes shelfEpisodes into <app-episode-scroller>', async () => {
    const eps = Array.from({ length: 5 }, (_, i) => makeEpisode({ id: `e${i}` }));
    const { fixture } = await setup({ episodes: signal(eps) });
    const scroller = fixture.debugElement.query(By.directive(EpisodeScroller))
      .componentInstance as EpisodeScroller;
    expect(scroller.episodes().length).toBe(4);
    expect(scroller.episodes()[0].id).toBe('e1');
  });
});
