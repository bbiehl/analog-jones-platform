import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, DeferBlockState, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { marked } from 'marked';

import { Episode, EpisodeWithRelations } from '@aj/core';
import { EpisodeStore } from '@aj/core';
import { EpisodeScroller } from '../../episode/episode-scroller/episode-scroller';
import { Home } from './home';

interface MockStore {
  episodes: WritableSignal<Episode[]>;
  currentEpisode: WritableSignal<Episode | null>;
  recentEpisodes: WritableSignal<Episode[]>;
  selectedEpisode: WritableSignal<EpisodeWithRelations | null>;
  totalVisible: WritableSignal<number>;
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  loadHomeData: ReturnType<typeof vi.fn>;
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
    totalVisible: signal(0),
    loading: signal(false),
    error: signal<string | null>(null),
    loadHomeData: vi.fn().mockResolvedValue(undefined),
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
      // Monitor and Drop render skeleton placeholders to reserve layout when no
      // featured episode is available — the interactive content is gated.
      expect(fixture.nativeElement.querySelector('a.monitor')).toBeNull();
      expect(fixture.nativeElement.querySelector('#drop .body h3')).toBeNull();
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
    it('calls loadHomeData once on init', async () => {
      const { store } = await setup({ episodes: signal([makeEpisode({ id: 'feat-1' })]) });
      expect(store.loadHomeData).toHaveBeenCalledTimes(1);
    });

    it('calls loadHomeData even when episodes is empty', async () => {
      const { store } = await setup();
      expect(store.loadHomeData).toHaveBeenCalledTimes(1);
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
      component['markedParse'].set((src) => marked.parse(src) as string);
      const rendered = component['featuredIntelligence']() as string;
      expect(rendered).toContain('…');
      expect(rendered.trim().startsWith('<p>')).toBe(true);
    });

    it('leaves short markdown unchanged (no ellipsis)', async () => {
      const ep = makeEpisode({ intelligence: '**hello** world' });
      const { component } = await setup({ episodes: signal([ep]) });
      component['markedParse'].set((src) => marked.parse(src) as string);
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

  describe('Hero section template', () => {
    it('shows PLAY EPISODE link routing to featured when present', async () => {
      const ep = makeEpisode({ id: 'feat-99' });
      const { fixture } = await setup({ episodes: signal([ep]) });
      const links = Array.from(
        fixture.nativeElement.querySelectorAll('.hero .cta a')
      ) as HTMLAnchorElement[];
      const play = links.find((a) => a.textContent?.includes('PLAY EPISODE'));
      expect(play).toBeTruthy();
      expect(play!.getAttribute('href')).toBe('/episodes/feat-99');
    });

    it('omits PLAY EPISODE link and renders skeleton placeholder when there is no featured episode', async () => {
      const { fixture } = await setup();
      const cta = fixture.nativeElement.querySelector('.hero .cta');
      const links = Array.from(cta?.querySelectorAll('a') ?? []) as HTMLAnchorElement[];
      expect(links.find((a) => a.textContent?.includes('PLAY EPISODE'))).toBeUndefined();
      expect(cta?.querySelector('.btn--skeleton')).toBeTruthy();
      expect(cta?.textContent ?? '').toContain('ENTER THE ARCHIVE');
    });

    it('renders padded TAPES CATALOGED count from totalVisible', async () => {
      const eps = Array.from({ length: 7 }, (_, i) => makeEpisode({ id: `e${i}` }));
      const { fixture } = await setup({
        episodes: signal(eps),
        totalVisible: signal(42),
      });
      const value = fixture.nativeElement.querySelector('.hero-meta .m .v')?.textContent ?? '';
      expect(value).toContain('42');
    });

    it('renders monitor with title, formatted date, and glow style when featured', async () => {
      const ep = makeEpisode({ id: 'mon-1', title: 'Monitor Tape' });
      const { fixture } = await setup({ episodes: signal([ep]) });
      const monitor = fixture.nativeElement.querySelector('a.monitor') as HTMLAnchorElement;
      expect(monitor).toBeTruthy();
      expect(monitor.getAttribute('href')).toBe('/episodes/mon-1');
      expect(monitor.getAttribute('aria-label')).toBe('Open Monitor Tape');
      expect(monitor.querySelector('.pl-title')?.textContent).toBe('Monitor Tape');
      expect(monitor.querySelector('.pl-meta')?.textContent).toMatch(/· 2024/);
      expect(monitor.querySelector('.monitor-glow')).toBeTruthy();
    });
  });

  describe('Drop section see-all + intelligence', () => {
    it('renders padded ALL XX TAPES link with totalVisible count', async () => {
      const eps = Array.from({ length: 9 }, (_, i) => makeEpisode({ id: `e${i}` }));
      const { fixture } = await setup({
        episodes: signal(eps),
        totalVisible: signal(12),
      });
      const seeAll = fixture.nativeElement.querySelector('#drop .see-all') as HTMLAnchorElement;
      expect(seeAll.textContent).toContain('ALL 12 TAPES');
      expect(seeAll.getAttribute('href')).toBe('/episodes');
    });

    it('renders featuredIntelligence into .notes via innerHTML', async () => {
      const ep = makeEpisode({ intelligence: '**bold**' });
      const { fixture, component } = await setup({ episodes: signal([ep]) });
      component['markedParse'].set((src) => marked.parse(src) as string);
      fixture.detectChanges();
      const notes = fixture.nativeElement.querySelector('#drop .notes') as HTMLElement;
      expect(notes).toBeTruthy();
      expect(notes.querySelector('strong')?.textContent).toBe('bold');
    });

    it('omits .notes when featuredIntelligence is null', async () => {
      const { fixture } = await setup({ episodes: signal([makeEpisode({ intelligence: null })]) });
      expect(fixture.nativeElement.querySelector('#drop .notes')).toBeNull();
    });

    it('always renders SHOW NOTES link when featured exists', async () => {
      const ep = makeEpisode({ id: 'sn-1' });
      const { fixture } = await setup({ episodes: signal([ep]) });
      const links = Array.from(
        fixture.nativeElement.querySelectorAll('#drop .actions a')
      ) as HTMLAnchorElement[];
      const showNotes = links.find((a) => a.textContent?.includes('SHOW NOTES'));
      expect(showNotes).toBeTruthy();
      expect(showNotes!.getAttribute('href')).toBe('/episodes/sn-1');
    });
  });

  describe('toDate', () => {
    it('converts a Firestore Timestamp to a Date', async () => {
      const { component } = await setup();
      const ep = makeEpisode();
      const d = component['toDate'](ep);
      expect(d).toBeInstanceOf(Date);
      expect(d.toISOString()).toBe('2024-06-01T00:00:00.000Z');
    });
  });

  describe('Trio defer block', () => {
    it('renders three host cards when complete', async () => {
      const { fixture } = await setup();
      const blocks = await fixture.getDeferBlocks();
      // shelf=0, trio=1, listen=2
      await blocks[1].render(DeferBlockState.Complete);
      const hosts = fixture.nativeElement.querySelectorAll('.hosts .host');
      expect(hosts.length).toBe(3);
      const inits = Array.from(fixture.nativeElement.querySelectorAll('.hosts .av')).map((el) =>
        (el as HTMLElement).getAttribute('data-init')
      );
      expect(inits).toEqual(['ST', 'CH', 'BR']);
    });
  });

  describe('Listen defer block', () => {
    it('renders Spotify and YouTube cards with external links', async () => {
      const { fixture } = await setup();
      const blocks = await fixture.getDeferBlocks();
      await blocks[2].render(DeferBlockState.Complete);
      const spotify = fixture.nativeElement.querySelector(
        '#listen .card.spotify a.btn.primary'
      ) as HTMLAnchorElement;
      const youtube = fixture.nativeElement.querySelector(
        '#listen .card.youtube a.btn.primary'
      ) as HTMLAnchorElement;
      expect(spotify.getAttribute('href')).toContain('open.spotify.com');
      expect(spotify.getAttribute('target')).toBe('_blank');
      expect(spotify.getAttribute('rel')).toBe('noopener');
      expect(youtube.getAttribute('href')).toContain('youtube.com');
      expect(youtube.getAttribute('target')).toBe('_blank');
      expect(youtube.getAttribute('rel')).toBe('noopener');
    });
  });

  it('passes shelfEpisodes into <app-episode-scroller>', async () => {
    const eps = Array.from({ length: 5 }, (_, i) => makeEpisode({ id: `e${i}` }));
    const { fixture } = await setup({ episodes: signal(eps) });
    const [shelfDeferBlock] = await fixture.getDeferBlocks();
    await shelfDeferBlock.render(DeferBlockState.Complete);
    const scroller = fixture.debugElement.query(By.directive(EpisodeScroller))
      .componentInstance as EpisodeScroller;
    expect(scroller.episodes().length).toBe(4);
    expect(scroller.episodes()[0].id).toBe('e1');
  });
});
