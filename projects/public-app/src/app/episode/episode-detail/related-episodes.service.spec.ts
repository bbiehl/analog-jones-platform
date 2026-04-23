import { TestBed } from '@angular/core/testing';

import { RelatedEpisodesService } from './related-episodes.service';

describe('RelatedEpisodesService', () => {
  let service: RelatedEpisodesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelatedEpisodesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
