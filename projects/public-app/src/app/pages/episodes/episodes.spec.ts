import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Episodes } from './episodes';
import { EpisodeListStore } from '../../episode/episode-list.store';

describe('Episodes', () => {
  let component: Episodes;
  let fixture: ComponentFixture<Episodes>;

  const mockStore = {
    episodesByGenre: signal({}),
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadEpisodesByGenre: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Episodes],
      providers: [{ provide: EpisodeListStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(Episodes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger loadEpisodesByGenre on init', () => {
    expect(mockStore.loadEpisodesByGenre).toHaveBeenCalled();
  });
});
