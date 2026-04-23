import { TestBed } from '@angular/core/testing';
import type { Firestore } from 'firebase/firestore';
import { FIRESTORE } from '../../../../../../libs/shared/firebase.token';
import { RelatedEpisodesService } from './related-episodes.service';

describe('RelatedEpisodesService', () => {
  let service: RelatedEpisodesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: FIRESTORE, useValue: {} as Firestore }],
    });
    service = TestBed.inject(RelatedEpisodesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
