import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { EpisodeStore } from '../../../../../../../libs/episode/episode.store';
import { RelatedEpisodeStore } from '../../../episode/episode-detail/related-episode.store';
import { EpisodeDetail } from './episode-detail';

describe('EpisodeDetail', () => {
  let component: EpisodeDetail;
  let fixture: ComponentFixture<EpisodeDetail>;

  const mockEpisodeStore = {
    selectedEpisode: () => null,
    loading: () => false,
    error: () => null,
    loadEpisodeById: vi.fn().mockResolvedValue(undefined),
    clearSelectedEpisode: vi.fn(),
  };

  const mockRelatedEpisodeStore = {
    relatedEpisodes: () => [],
    loading: () => false,
    error: () => null,
    loadRelatedEpisodes: vi.fn().mockResolvedValue(undefined),
    clearRelatedEpisodes: vi.fn(),
  };

  const mockActivatedRoute = {
    paramMap: of(convertToParamMap({ id: 'ep1' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeDetail],
      providers: [
        { provide: EpisodeStore, useValue: mockEpisodeStore },
        { provide: RelatedEpisodeStore, useValue: mockRelatedEpisodeStore },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
