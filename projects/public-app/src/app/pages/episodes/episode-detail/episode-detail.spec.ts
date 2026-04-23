import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { EpisodeStore } from '../../../../../../../libs/episode/episode.store';
import type { EpisodeWithRelations } from '../../../../../../../libs/episode/episode.model';
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

    it('renders CASE number from the first 6 chars of the id, upper-cased', async () => {
      await createComponent('ab12cd34ef56');
      const caseValue = fixture.debugElement.query(By.css('.file-meta-row .v.mono'));
      expect(caseValue.nativeElement.textContent.trim()).toBe('AB12CD');
    });

    it('renders the placeholder case number when no id is in the route', async () => {
      await createComponent(null);
      const caseValue = fixture.debugElement.query(By.css('.file-meta-row .v.mono'));
      expect(caseValue.nativeElement.textContent.trim()).toBe('— — — — — —');
    });

    it('renders the static TRANSMISSION LOG file row and REC badge', async () => {
      await createComponent();
      const html = fixture.nativeElement.textContent;
      expect(html).toContain('TRANSMISSION LOG');
      expect(html).toContain('REC');
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
      await createComponent();

      expect(fixture.debugElement.query(By.css('app-episode-scroller'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.no-crossrefs'))).toBeFalsy();
    });

    it('renders the no-crossrefs fallback when episode loaded but no related episodes', async () => {
      selectedEpisode.set(makeEpisode());
      await createComponent();

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
  });
});
