import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { EpisodeStore } from '@aj/core';
import type { EpisodeWithRelations } from '@aj/core';
import { RelatedEpisodeStore } from '../../../episode/episode-detail/related-episode.store';
import { EpisodeDetail } from './episode-detail';

function makeEpisode(overrides: Partial<EpisodeWithRelations> = {}): EpisodeWithRelations {
  return {
    id: 'ep1',
    title: 'Test Episode',
    createdAt: Timestamp.fromMillis(0),
    episodeDate: Timestamp.fromMillis(0),
    intelligence: null,
    isVisible: true,
    links: {},
    posterUrl: null,
    categories: [],
    genres: [],
    tags: [],
    ...overrides,
  };
}

describe('EpisodeDetail', () => {
  let fixture: ComponentFixture<EpisodeDetail>;

  let selectedEpisode: ReturnType<typeof signal<EpisodeWithRelations | null>>;
  let loading: ReturnType<typeof signal<boolean>>;
  let error: ReturnType<typeof signal<string | null>>;
  let relatedEpisodes: ReturnType<typeof signal<EpisodeWithRelations[]>>;
  let relatedLoading: ReturnType<typeof signal<boolean>>;

  let mockEpisodeStore: {
    selectedEpisode: () => EpisodeWithRelations | null;
    loading: () => boolean;
    error: () => string | null;
    loadEpisodeById: ReturnType<typeof vi.fn>;
    clearSelectedEpisode: ReturnType<typeof vi.fn>;
  };

  let mockRelatedEpisodeStore: {
    relatedEpisodes: () => EpisodeWithRelations[];
    loading: () => boolean;
    error: () => string | null;
    loadRelatedEpisodes: ReturnType<typeof vi.fn>;
    clearRelatedEpisodes: ReturnType<typeof vi.fn>;
  };

  async function createComponent(routeId: string | null = 'ep123456ABC') {
    const paramMap$ = of(convertToParamMap(routeId ? { id: routeId } : {}));

    TestBed.configureTestingModule({
      imports: [EpisodeDetail],
      providers: [
        provideRouter([]),
        { provide: EpisodeStore, useValue: mockEpisodeStore },
        { provide: RelatedEpisodeStore, useValue: mockRelatedEpisodeStore },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } },
      ],
    });

    await TestBed.compileComponents();
    fixture = TestBed.createComponent(EpisodeDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    selectedEpisode = signal<EpisodeWithRelations | null>(null);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);
    relatedEpisodes = signal<EpisodeWithRelations[]>([]);
    relatedLoading = signal<boolean>(false);

    mockEpisodeStore = {
      selectedEpisode: () => selectedEpisode(),
      loading: () => loading(),
      error: () => error(),
      loadEpisodeById: vi.fn().mockResolvedValue(undefined),
      clearSelectedEpisode: vi.fn(),
    };

    mockRelatedEpisodeStore = {
      relatedEpisodes: () => relatedEpisodes(),
      loading: () => relatedLoading(),
      error: () => null,
      loadRelatedEpisodes: vi.fn().mockResolvedValue(undefined),
      clearRelatedEpisodes: vi.fn(),
    };
  });

  it('should create', async () => {
    await createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('case-file header', () => {
    it('renders the RETURN TO ARCHIVE back chip linking to /episodes', async () => {
      await createComponent();
      const chip = fixture.debugElement.query(By.css('.back-chip'));
      expect(chip).toBeTruthy();
      expect(chip.nativeElement.getAttribute('href')).toBe('/episodes');
      expect(chip.nativeElement.textContent).toContain('RETURN TO ARCHIVE');
    });

  });

  describe('dossier block', () => {
    it('shows the properties skeleton while loading', async () => {
      loading.set(true);
      await createComponent();

      expect(
        fixture.debugElement.query(By.css('app-episode-properties-skeleton')),
      ).toBeTruthy();
      expect(fixture.debugElement.query(By.css('app-episode-properties'))).toBeFalsy();
    });

    it('shows the skeleton when not loading but no episode is selected', async () => {
      await createComponent();

      expect(
        fixture.debugElement.query(By.css('app-episode-properties-skeleton')),
      ).toBeTruthy();
      expect(fixture.debugElement.query(By.css('app-episode-properties'))).toBeFalsy();
    });

    it('renders the episode properties once the episode is loaded', async () => {
      selectedEpisode.set(makeEpisode());
      await createComponent();

      expect(fixture.debugElement.query(By.css('app-episode-properties'))).toBeTruthy();
      expect(
        fixture.debugElement.query(By.css('app-episode-properties-skeleton')),
      ).toBeFalsy();
    });
  });

  describe('related episodes section', () => {
    it('shows the scroller skeleton while related episodes are loading', async () => {
      relatedLoading.set(true);
      await createComponent();

      expect(fixture.debugElement.query(By.css('app-episode-scroller-skeleton'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('app-episode-scroller'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.no-crossrefs'))).toBeFalsy();
    });

    it('renders the scroller when related episodes are available', async () => {
      selectedEpisode.set(makeEpisode());
      relatedEpisodes.set([makeEpisode({ id: 'ep2' }), makeEpisode({ id: 'ep3' })]);
      await createComponent('ep1');

      expect(fixture.debugElement.query(By.css('app-episode-scroller'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.no-crossrefs'))).toBeFalsy();
    });

    it('renders the no-crossrefs fallback when episode loaded but no related episodes', async () => {
      selectedEpisode.set(makeEpisode());
      await createComponent('ep1');

      const card = fixture.debugElement.query(By.css('.no-crossrefs-card'));
      expect(card).toBeTruthy();

      const text = card.nativeElement.textContent;
      expect(text).toContain('NO RELATED');
      expect(text).toContain('FILES ON RECORD');
      expect(text).toContain('/ CROSS-REFERENCE INDEX');

      const cta = fixture.debugElement.query(By.css('.no-crossrefs-card a.btn.primary'));
      expect(cta.nativeElement.getAttribute('href')).toBe('/episodes');
      expect(cta.nativeElement.textContent).toContain('ENTER THE ARCHIVE');

      const stamp = fixture.debugElement.query(By.css('.no-crossrefs-stamp'));
      expect(stamp.nativeElement.textContent).toContain('UNIQUE');
      expect(stamp.nativeElement.textContent).toContain('SPECIMEN');
    });

    it('does not render the no-crossrefs fallback while the episode is still loading', async () => {
      loading.set(true);
      await createComponent();

      expect(fixture.debugElement.query(By.css('.no-crossrefs'))).toBeFalsy();
    });

    it('does not render the no-crossrefs fallback when no episode is selected', async () => {
      await createComponent();

      expect(fixture.debugElement.query(By.css('.no-crossrefs'))).toBeFalsy();
    });

    it('hides stale related episodes when the loaded episode id does not match the route id', async () => {
      selectedEpisode.set(makeEpisode({ id: 'previous' }));
      relatedEpisodes.set([makeEpisode({ id: 'ep2' })]);
      await createComponent('current');

      expect(fixture.debugElement.query(By.css('app-episode-scroller'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.no-crossrefs'))).toBeFalsy();
    });
  });

  describe('route id change side effects', () => {
    it('clears the related episodes store when the route id is set', async () => {
      await createComponent('ep123456ABC');
      expect(mockRelatedEpisodeStore.clearRelatedEpisodes).toHaveBeenCalled();
    });
  });

  describe('episode loading effect', () => {
    it('calls loadEpisodeById when the route id is present', async () => {
      await createComponent('ep123456ABC');
      expect(mockEpisodeStore.loadEpisodeById).toHaveBeenCalledWith('ep123456ABC');
    });

    it('does not call loadEpisodeById when the route has no id', async () => {
      await createComponent(null);
      expect(mockEpisodeStore.loadEpisodeById).not.toHaveBeenCalled();
    });
  });

  describe('related episodes loading effect', () => {
    it('loads related episodes when the selected episode matches the route id and is visible', async () => {
      const ep = makeEpisode({ id: 'ep123456ABC', isVisible: true });
      selectedEpisode.set(ep);
      await createComponent('ep123456ABC');

      expect(mockRelatedEpisodeStore.loadRelatedEpisodes).toHaveBeenCalledWith(ep);
    });

    it('does not load related episodes when the selected episode id does not match the route id', async () => {
      selectedEpisode.set(makeEpisode({ id: 'different-id', isVisible: true }));
      await createComponent('ep123456ABC');

      expect(mockRelatedEpisodeStore.loadRelatedEpisodes).not.toHaveBeenCalled();
    });

    it('does not load related episodes when the selected episode is not visible', async () => {
      selectedEpisode.set(makeEpisode({ id: 'ep123456ABC', isVisible: false }));
      await createComponent('ep123456ABC');

      expect(mockRelatedEpisodeStore.loadRelatedEpisodes).not.toHaveBeenCalled();
    });

    it('does not load related episodes when no episode is selected', async () => {
      await createComponent('ep123456ABC');
      expect(mockRelatedEpisodeStore.loadRelatedEpisodes).not.toHaveBeenCalled();
    });
  });

  describe('not-found navigation effect', () => {
    async function createWithRouterSpy(routeId: string | null = 'ep123456ABC') {
      const paramMap$ = of(convertToParamMap(routeId ? { id: routeId } : {}));
      const navigateByUrl = vi.fn();

      TestBed.configureTestingModule({
        imports: [EpisodeDetail],
        providers: [
          provideRouter([]),
          { provide: EpisodeStore, useValue: mockEpisodeStore },
          { provide: RelatedEpisodeStore, useValue: mockRelatedEpisodeStore },
          { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } },
          { provide: Router, useValue: { navigateByUrl } },
        ],
      });

      await TestBed.compileComponents();
      fixture = TestBed.createComponent(EpisodeDetail);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      return { navigateByUrl };
    }

    it('navigates to /not-found when loading finishes with a store error', async () => {
      loading.set(true);
      const { navigateByUrl } = await createWithRouterSpy('ep123456ABC');

      error.set('boom');
      loading.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('navigates to /not-found when loading finishes with no episode', async () => {
      loading.set(true);
      const { navigateByUrl } = await createWithRouterSpy('ep123456ABC');

      loading.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('navigates to /not-found when the loaded episode id does not match the route id', async () => {
      loading.set(true);
      const { navigateByUrl } = await createWithRouterSpy('ep123456ABC');

      selectedEpisode.set(makeEpisode({ id: 'different', isVisible: true }));
      loading.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('navigates to /not-found when the loaded episode is hidden', async () => {
      loading.set(true);
      const { navigateByUrl } = await createWithRouterSpy('ep123456ABC');

      selectedEpisode.set(makeEpisode({ id: 'ep123456ABC', isVisible: false }));
      loading.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('does not navigate when loading finishes and a valid episode is loaded', async () => {
      loading.set(true);
      const { navigateByUrl } = await createWithRouterSpy('ep123456ABC');

      selectedEpisode.set(makeEpisode({ id: 'ep123456ABC', isVisible: true }));
      loading.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('does not navigate while still loading', async () => {
      loading.set(true);
      const { navigateByUrl } = await createWithRouterSpy('ep123456ABC');
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('does not navigate when there was never a loading transition', async () => {
      const { navigateByUrl } = await createWithRouterSpy('ep123456ABC');
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('does not navigate when the route has no id', async () => {
      loading.set(true);
      const { navigateByUrl } = await createWithRouterSpy(null);

      loading.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('clears the selected episode and related episodes on destroy', async () => {
      await createComponent();
      fixture.destroy();

      expect(mockEpisodeStore.clearSelectedEpisode).toHaveBeenCalled();
      expect(mockRelatedEpisodeStore.clearRelatedEpisodes).toHaveBeenCalled();
    });
  });
});
