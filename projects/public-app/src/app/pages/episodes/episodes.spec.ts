import { ComponentFixture, DeferBlockState, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Timestamp } from 'firebase/firestore';

import { Episodes } from './episodes';
import { EpisodeScroller } from '../../episode/episode-scroller/episode-scroller';
import { EpisodeListStore } from '../../episode/episode-list.store';
import { Episode } from '@aj/core';

function makeEpisode(id: string, title: string): Episode {
  return {
    id,
    createdAt: Timestamp.fromMillis(0),
    episodeDate: Timestamp.fromMillis(1_700_000_000_000),
    intelligence: null,
    isVisible: true,
    links: {},
    posterUrl: null,
    title,
  };
}

describe('Episodes', () => {
  let component: Episodes;
  let fixture: ComponentFixture<Episodes>;

  const episodesByCategory = signal<{ [category: string]: Episode[] }>({});
  const episodesByGenre = signal<{ [genre: string]: Episode[] }>({});
  const isLoading = signal(false);
  const categoryLoaded = signal(true);
  const error = signal<string | null>(null);

  const mockStore = {
    episodesByCategory,
    episodesByGenre,
    isLoading,
    categoryLoaded,
    error,
    load: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    episodesByCategory.set({});
    episodesByGenre.set({});
    isLoading.set(false);
    categoryLoaded.set(true);
    error.set(null);
    mockStore.load.mockClear();

    await TestBed.configureTestingModule({
      imports: [Episodes],
      providers: [provideRouter([]), { provide: EpisodeListStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(Episodes);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger load on init', () => {
    expect(mockStore.load).toHaveBeenCalled();
  });

  it('should render the page heading and intro copy', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('h1')?.textContent).toContain('Episodes');
    expect(host.textContent).toContain('Browse all available episodes.');
  });

  describe('loading state', () => {
    it('renders one skeleton scroller per configured placeholder slot', () => {
      isLoading.set(true);
      fixture.detectChanges();

      const skeletons = fixture.nativeElement.querySelectorAll(
        'app-episode-scroller-skeleton'
      );
      expect(skeletons.length).toBe(2);

      const busyRegions = fixture.nativeElement.querySelectorAll('[aria-busy="true"]');
      expect(busyRegions.length).toBe(2);
      expect(busyRegions[0].getAttribute('aria-label')).toBe('Loading episodes');
    });

    it('does not render scrollers, error, or empty message while loading', () => {
      isLoading.set(true);
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('app-episode-scroller')).toBeNull();
      expect(host.querySelector('[role="alert"]')).toBeNull();
      expect(host.textContent).not.toContain('No episodes found.');
    });
  });

  describe('error state', () => {
    it('renders the error message in a role="alert" element', () => {
      error.set('Something went wrong');
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('Something went wrong');
    });

    it('does not render scrollers when an error is present', () => {
      error.set('Boom');
      episodesByGenre.set({ Rock: [makeEpisode('e1', 'A')] });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-episode-scroller')).toBeNull();
    });
  });

  describe('empty state', () => {
    it('shows the empty message when there are no genres or categories', () => {
      episodesByCategory.set({});
      episodesByGenre.set({});
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No episodes found.');
      expect(fixture.nativeElement.querySelector('app-episode-scroller')).toBeNull();
    });

    it('renders skeletons (not the empty message) while category shelves are still resolving', () => {
      episodesByCategory.set({});
      episodesByGenre.set({});
      categoryLoaded.set(false);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('No episodes found.');
      const skeletons = fixture.nativeElement.querySelectorAll('app-episode-scroller-skeleton');
      expect(skeletons.length).toBe(2);
    });
  });

  describe('populated state', () => {
    beforeEach(() => {
      episodesByGenre.set({
        Rock: [makeEpisode('e1', 'A'), makeEpisode('e2', 'B')],
        Jazz: [makeEpisode('e3', 'C')],
      });
      fixture.detectChanges();
    });

    it('renders one episode-scroller per genre entry', () => {
      const scrollers = fixture.nativeElement.querySelectorAll('app-episode-scroller');
      expect(scrollers.length).toBe(2);
    });

    it('preserves genre order from the store map', () => {
      const headings = Array.from(
        fixture.nativeElement.querySelectorAll('app-episode-scroller')
      ).map((el) => (el as HTMLElement).querySelector('h2,h3,header')?.textContent ?? '');
      // We don't assert exact heading template — only that the store-provided
      // genre order is preserved by checking the underlying entries.
      expect(component['entries']().map((e) => e.heading)).toEqual(['Rock', 'Jazz']);
      expect(headings.length).toBe(2);
    });

    it('hides loading/error/empty branches when populated', () => {
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('[aria-busy="true"]')).toBeNull();
      expect(host.querySelector('[role="alert"]')).toBeNull();
      expect(host.textContent).not.toContain('No episodes found.');
    });
  });

  describe('eager vs deferred rendering', () => {
    it('renders only the first two genres eagerly and defers the rest as placeholders', () => {
      episodesByGenre.set({
        Rock: [makeEpisode('e1', 'A')],
        Jazz: [makeEpisode('e2', 'B')],
        Pop: [makeEpisode('e3', 'C')],
        Folk: [makeEpisode('e4', 'D')],
      });
      fixture.detectChanges();

      const eagerScrollers = fixture.debugElement.queryAll(By.directive(EpisodeScroller));
      expect(eagerScrollers.length).toBe(2);

      const placeholders = fixture.nativeElement.querySelectorAll('div.defer-shelf');
      expect(placeholders.length).toBe(2);
      placeholders.forEach((el: Element) => {
        expect(el.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('renders no defer placeholders when there are two or fewer genres', () => {
      episodesByGenre.set({
        Rock: [makeEpisode('e1', 'A')],
        Jazz: [makeEpisode('e2', 'B')],
      });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('div.defer-shelf').length).toBe(0);
      expect(fixture.debugElement.queryAll(By.directive(EpisodeScroller)).length).toBe(2);
    });

    it('renders the deferred scroller once its defer block completes', async () => {
      episodesByGenre.set({
        Rock: [makeEpisode('e1', 'A')],
        Jazz: [makeEpisode('e2', 'B')],
        Pop: [makeEpisode('e3', 'C')],
      });
      fixture.detectChanges();

      const blocks = await fixture.getDeferBlocks();
      expect(blocks.length).toBe(1);
      await blocks[0].render(DeferBlockState.Complete);

      const scrollers = fixture.debugElement.queryAll(By.directive(EpisodeScroller));
      expect(scrollers.length).toBe(3);
      expect(fixture.nativeElement.querySelectorAll('div.defer-shelf').length).toBe(0);
    });
  });

  describe('scroller input bindings', () => {
    it('passes episodes, heading, and ariaLabel from each genre entry into the scroller', () => {
      const rock = [makeEpisode('e1', 'A'), makeEpisode('e2', 'B')];
      const jazz = [makeEpisode('e3', 'C')];
      episodesByGenre.set({ Rock: rock, Jazz: jazz });
      fixture.detectChanges();

      const scrollers = fixture.debugElement
        .queryAll(By.directive(EpisodeScroller))
        .map((d) => d.componentInstance as EpisodeScroller);

      expect(scrollers[0].heading()).toBe('Rock');
      expect(scrollers[0].ariaLabel()).toBe('Rock');
      expect(scrollers[0].episodes()).toEqual(rock);

      expect(scrollers[1].heading()).toBe('Jazz');
      expect(scrollers[1].ariaLabel()).toBe('Jazz');
      expect(scrollers[1].episodes()).toEqual(jazz);
    });

    it('passes the correct genre data into a scroller after its defer block resolves', async () => {
      const rock = [makeEpisode('e1', 'A')];
      const jazz = [makeEpisode('e2', 'B')];
      const pop = [makeEpisode('e3', 'C')];
      episodesByGenre.set({ Rock: rock, Jazz: jazz, Pop: pop });
      fixture.detectChanges();

      const [block] = await fixture.getDeferBlocks();
      await block.render(DeferBlockState.Complete);

      const scrollers = fixture.debugElement
        .queryAll(By.directive(EpisodeScroller))
        .map((d) => d.componentInstance as EpisodeScroller);

      expect(scrollers[2].heading()).toBe('Pop');
      expect(scrollers[2].ariaLabel()).toBe('Pop');
      expect(scrollers[2].episodes()).toEqual(pop);
    });
  });

  describe('computed signals', () => {
    it('hasEpisodes is false when both maps are empty', () => {
      episodesByCategory.set({});
      episodesByGenre.set({});
      expect(component['hasEpisodes']()).toBe(false);
    });

    it('hasEpisodes is true when at least one genre has episodes', () => {
      episodesByGenre.set({ Rock: [makeEpisode('e1', 'A')] });
      expect(component['hasEpisodes']()).toBe(true);
    });

    it('hasEpisodes is true when at least one category has episodes', () => {
      episodesByCategory.set({ 'Nerd News': [makeEpisode('e1', 'A')] });
      expect(component['hasEpisodes']()).toBe(true);
    });

    it('entries reflects updates from the store', () => {
      episodesByGenre.set({ Pop: [makeEpisode('e1', 'A')] });
      expect(component['entries']()).toEqual([
        { key: 'gen:Pop', heading: 'Pop', episodes: [makeEpisode('e1', 'A')] },
      ]);
    });

    it('entries renders category rows before genre rows', () => {
      const nerd = makeEpisode('e1', 'Nerd');
      const rock = makeEpisode('e2', 'Rock');
      episodesByCategory.set({ 'Nerd News': [nerd] });
      episodesByGenre.set({ Rock: [rock] });

      expect(component['entries']().map((e) => e.heading)).toEqual(['Nerd News', 'Rock']);
    });
  });
});
