import { TestBed } from '@angular/core/testing';

import { EpisodeListService } from './episode-list.service';

describe('EpisodeListService', () => {
  let service: EpisodeListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EpisodeListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
