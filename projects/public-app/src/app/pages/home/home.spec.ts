import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EpisodeStore } from '../../../../../../libs/episode/episode.store';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    const mockEpisodeStore = {
      episodes: signal([]),
      currentEpisode: signal(null),
      recentEpisodes: signal([]),
      selectedEpisode: signal(null),
      loading: signal(false),
      error: signal(null),
      loadVisibleEpisodes: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: EpisodeStore, useValue: mockEpisodeStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
