import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { EpisodeWithRelations } from '../../../../../../../libs/episode/episode.model';
import { EpisodeProperties } from './episode-properties';

describe('EpisodeProperties', () => {
  let component: EpisodeProperties;
  let fixture: ComponentFixture<EpisodeProperties>;

  const episode: EpisodeWithRelations = {
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
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeProperties],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeProperties);
    fixture.componentRef.setInput('episode', episode);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
