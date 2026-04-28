import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { EpisodeWithRelations } from '../../../../../../../libs/episode/episode.model';
import { EpisodeProperties } from './episode-properties';

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

describe('EpisodeProperties', () => {
  let component: EpisodeProperties;
  let fixture: ComponentFixture<EpisodeProperties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeProperties],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeProperties);
    component = fixture.componentInstance;
  });

  function setInputs(inputs: Record<string, unknown>) {
    for (const [k, v] of Object.entries(inputs)) {
      fixture.componentRef.setInput(k, v);
    }
  }

  it('should create', () => {
    setInputs({ episode: makeEpisode() });
    expect(component).toBeTruthy();
  });

  it('renders the episode title', () => {
    setInputs({ episode: makeEpisode({ title: 'Hidden Mix' }) });
    fixture.detectChanges();
    const title: HTMLElement = fixture.nativeElement.querySelector('.file-title');
    expect(title.textContent).toContain('Hidden Mix');
  });

  describe('case number', () => {
    it('renders provided caseNumber in label', () => {
      setInputs({ episode: makeEpisode(), caseNumber: 'AJ-0042' });
      fixture.detectChanges();
      const labelCase: HTMLElement = fixture.nativeElement.querySelector('.label-case');
      expect(labelCase.textContent?.trim()).toBe('AJ-0042');
    });

    it('falls back to placeholder dashes when caseNumber is null', () => {
      setInputs({ episode: makeEpisode() });
      fixture.detectChanges();
      const labelCase: HTMLElement = fixture.nativeElement.querySelector('.label-case');
      expect(labelCase.textContent?.trim()).toBe('— — — —');
    });
  });

  describe('chips row', () => {
    it('is omitted when there are no classifications', () => {
      setInputs({ episode: makeEpisode() });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.chips-row')).toBeNull();
    });

    it('renders accent, cyan, and amber chips for categories, genres, and tags', () => {
      setInputs({
        episode: makeEpisode({
          categories: [{ id: 'c1', name: 'Music', slug: 'music' }],
          genres: [{ id: 'g1', name: 'Synthwave', slug: 'synthwave' }],
          tags: [{ id: 't1', name: 'vhs', slug: 'vhs' }],
        }),
      });
      fixture.detectChanges();
      const chipsRow = fixture.nativeElement.querySelector('.chips-row');
      expect(chipsRow).not.toBeNull();
      expect(chipsRow.querySelector('.chip--accent').textContent.trim()).toBe('Music');
      expect(chipsRow.querySelector('.chip--cyan').textContent.trim()).toBe('Synthwave');
      expect(chipsRow.querySelector('.chip--amber').textContent.trim()).toBe('#vhs');
    });
  });

  describe('REEL spec', () => {
    it('shows counts of categories/genres/tags', () => {
      setInputs({
        episode: makeEpisode({
          categories: [
            { id: 'c1', name: 'A', slug: 'a' },
            { id: 'c2', name: 'B', slug: 'b' },
          ],
          genres: [{ id: 'g1', name: 'G', slug: 'g' }],
          tags: [
            { id: 't1', name: 'x', slug: 'x' },
            { id: 't2', name: 'y', slug: 'y' },
            { id: 't3', name: 'z', slug: 'z' },
          ],
        }),
      });
      fixture.detectChanges();
      const reel: HTMLElement = fixture.nativeElement.querySelectorAll('.sleeve-specs dd')[2];
      expect(reel.textContent?.trim()).toBe('2/1/3');
    });

    it('shows dashes when all classification arrays are empty', () => {
      setInputs({ episode: makeEpisode() });
      fixture.detectChanges();
      const reel: HTMLElement = fixture.nativeElement.querySelectorAll('.sleeve-specs dd')[2];
      expect(reel.textContent?.trim()).toBe('—/—/—');
    });
  });

  describe('transmission log', () => {
    it('renders parsed markdown into tx-body', () => {
      setInputs({
        episode: makeEpisode({ intelligence: '# Heading\n\nSome **bold** body.' }),
      });
      fixture.detectChanges();
      const body: HTMLElement = fixture.nativeElement.querySelector('.tx-body');
      expect(body.classList.contains('tx-body--empty')).toBe(false);
      expect(body.querySelector('h1')?.textContent).toContain('Heading');
      expect(body.querySelector('strong')?.textContent).toBe('bold');
    });

    it('renders empty state when intelligence is null', () => {
      setInputs({ episode: makeEpisode({ intelligence: null }) });
      fixture.detectChanges();
      const body: HTMLElement = fixture.nativeElement.querySelector('.tx-body');
      expect(body.classList.contains('tx-body--empty')).toBe(true);
      expect(body.textContent).toContain('NO NOTES RECORDED');
    });

    it('renders empty state when intelligence is an empty string', () => {
      setInputs({ episode: makeEpisode({ intelligence: '' }) });
      fixture.detectChanges();
      const body: HTMLElement = fixture.nativeElement.querySelector('.tx-body');
      expect(body.classList.contains('tx-body--empty')).toBe(true);
    });
  });

  describe('cta-row links', () => {
    it('is omitted when there are no links', () => {
      setInputs({ episode: makeEpisode() });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cta-row')).toBeNull();
    });

    it('renders spotify button with target/rel when spotify link exists', () => {
      setInputs({
        episode: makeEpisode({ links: { spotify: 'https://open.spotify.com/episode/xyz' } }),
      });
      fixture.detectChanges();
      const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.btn--spotify');
      expect(anchor).not.toBeNull();
      expect(anchor.getAttribute('href')).toBe('https://open.spotify.com/episode/xyz');
      expect(anchor.getAttribute('target')).toBe('_blank');
      expect(anchor.getAttribute('rel')).toBe('noopener');
      expect(fixture.nativeElement.querySelector('.btn--youtube')).toBeNull();
    });

    it('renders youtube button when only youtube link exists', () => {
      setInputs({
        episode: makeEpisode({ links: { youtube: 'https://youtu.be/abc' } }),
      });
      fixture.detectChanges();
      const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.btn--youtube');
      expect(anchor).not.toBeNull();
      expect(anchor.getAttribute('href')).toBe('https://youtu.be/abc');
      expect(fixture.nativeElement.querySelector('.btn--spotify')).toBeNull();
    });

    it('renders both buttons when both links exist', () => {
      setInputs({
        episode: makeEpisode({
          links: { spotify: 'https://s', youtube: 'https://y' },
        }),
      });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.btn--spotify')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.btn--youtube')).not.toBeNull();
    });
  });

  describe('sleeveBackground', () => {
    function readSleeveBg(c: EpisodeProperties): string {
      return (c as unknown as { sleeveBackground: () => string }).sleeveBackground();
    }

    it('uses url() and fallback color when posterUrl is set', () => {
      setInputs({
        episode: makeEpisode({ posterUrl: 'https://cdn.example/p.jpg' }),
      });
      const bg = readSleeveBg(component);
      expect(bg).toContain("url('https://cdn.example/p.jpg')");
      expect(bg).toContain('#050509');
    });

    it('uses gradient stack when posterUrl is null', () => {
      setInputs({ episode: makeEpisode({ posterUrl: null }) });
      const bg = readSleeveBg(component);
      expect(bg).toContain('linear-gradient');
      expect(bg).toContain('radial-gradient');
      expect(bg).toContain('repeating-linear-gradient');
      expect(bg).toMatch(/hsl\(\d{1,3}, 55%, 42%\)/);
    });

    it('seeds color by id when present, independent of title', () => {
      setInputs({ episode: makeEpisode({ id: 'same', title: 'Alpha' }) });
      const byId = readSleeveBg(component);

      const fixture2 = TestBed.createComponent(EpisodeProperties);
      fixture2.componentRef.setInput(
        'episode',
        makeEpisode({ id: 'same', title: 'CompletelyDifferentTitle' }),
      );
      const byIdAgain = readSleeveBg(fixture2.componentInstance);

      expect(byId).toBe(byIdAgain);
    });

    it('falls back to title as color seed when id is absent', () => {
      const fixture3 = TestBed.createComponent(EpisodeProperties);
      fixture3.componentRef.setInput(
        'episode',
        makeEpisode({ id: undefined, title: 'only-title-seed' }),
      );
      const bg = readSleeveBg(fixture3.componentInstance);
      expect(bg).toMatch(/hsl\(\d{1,3}, 55%, 42%\)/);
    });
  });
});
