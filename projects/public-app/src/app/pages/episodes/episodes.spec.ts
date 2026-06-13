import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Timestamp } from 'firebase/firestore';

import { Episodes } from './episodes';
import { Episode, EpisodeStore } from '@aj/core';

function makeEpisode(id: string, title: string, dateMs = 1_700_000_000_000): Episode {
  return {
    id,
    createdAt: Timestamp.fromMillis(0),
    episodeDate: Timestamp.fromMillis(dateMs),
    intelligence: null,
    isVisible: true,
    links: {},
    title,
  };
}

describe('Episodes', () => {
  let component: Episodes;
  let fixture: ComponentFixture<Episodes>;

  const episodes = signal<Episode[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);

  const mockStore = {
    episodes,
    loading,
    error,
    loadVisibleEpisodes: vi.fn().mockResolvedValue(undefined),
  };

  function cards(): NodeListOf<Element> {
    return fixture.nativeElement.querySelectorAll('.episode-grid [role="listitem"]');
  }

  beforeEach(async () => {
    episodes.set([]);
    loading.set(false);
    error.set(null);
    mockStore.loadVisibleEpisodes.mockClear();

    await TestBed.configureTestingModule({
      imports: [Episodes],
      providers: [provideRouter([]), { provide: EpisodeStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(Episodes);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads visible episodes on init', () => {
    expect(mockStore.loadVisibleEpisodes).toHaveBeenCalled();
  });

  it('renders the page heading and intro copy', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('h1')?.textContent).toContain('Episodes');
    expect(host.textContent).toContain('Browse all available episodes');
  });

  describe('loading state', () => {
    it('renders the busy skeleton grid and no cards, error, or empty message', () => {
      loading.set(true);
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('[aria-busy="true"]')).toBeTruthy();
      expect(cards().length).toBe(0);
      expect(host.querySelector('[role="alert"]')).toBeNull();
      expect(host.textContent).not.toContain('No episodes found.');
    });
  });

  describe('error state', () => {
    it('renders the error message in a role="alert" element and no cards', () => {
      error.set('Something went wrong');
      episodes.set([makeEpisode('e1', 'A')]);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('Something went wrong');
      expect(cards().length).toBe(0);
    });
  });

  describe('empty state', () => {
    it('shows the empty message when there are no episodes', () => {
      episodes.set([]);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No episodes found.');
      expect(cards().length).toBe(0);
    });
  });

  describe('populated state', () => {
    beforeEach(() => {
      episodes.set([
        makeEpisode('e1', 'Aliens', 3000),
        makeEpisode('e2', 'Predator', 2000),
        makeEpisode('e3', 'The Thing', 1000),
      ]);
      fixture.detectChanges();
    });

    it('renders one card per episode in store order', () => {
      const names = Array.from(cards()).map(
        (el) => el.querySelector('.name')?.textContent?.trim() ?? '',
      );
      expect(names).toEqual(['Aliens', 'Predator', 'The Thing']);
    });

    it('links each card to its detail route', () => {
      const link = cards()[0].querySelector('a');
      expect(link?.getAttribute('href')).toContain('/episodes/e1');
    });

    it('hides loading/error/empty branches when populated', () => {
      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('[aria-busy="true"]')).toBeNull();
      expect(host.querySelector('[role="alert"]')).toBeNull();
      expect(host.textContent).not.toContain('No episodes found.');
    });
  });

  describe('title search filter', () => {
    beforeEach(() => {
      episodes.set([
        makeEpisode('e1', 'Aliens'),
        makeEpisode('e2', 'Predator'),
        makeEpisode('e3', 'Alien Resurrection'),
      ]);
      fixture.detectChanges();
    });

    it('narrows the rendered cards case-insensitively', () => {
      component['searchControl'].setValue('alien');
      fixture.detectChanges();

      const names = Array.from(cards()).map(
        (el) => el.querySelector('.name')?.textContent?.trim() ?? '',
      );
      expect(names).toEqual(['Aliens', 'Alien Resurrection']);
    });

    it('shows the no-match message when nothing matches the search', () => {
      component['searchControl'].setValue('zzz');
      fixture.detectChanges();

      expect(cards().length).toBe(0);
      expect(fixture.nativeElement.textContent).toContain('No episodes match your search.');
      expect(fixture.nativeElement.textContent).not.toContain('No episodes found.');
    });

    it('restores the full list when the search is cleared', () => {
      component['searchControl'].setValue('predator');
      fixture.detectChanges();
      expect(cards().length).toBe(1);

      component['searchControl'].setValue('');
      fixture.detectChanges();
      expect(cards().length).toBe(3);
    });
  });
});
