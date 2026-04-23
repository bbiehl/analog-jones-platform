import { TestBed } from '@angular/core/testing';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { FIRESTORE, STORAGE } from '../../../../../libs/shared/firebase.token';
import { ExploreSearchService } from './explore-search.service';

describe('ExploreSearchService', () => {
  let service: ExploreSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: {} as Firestore },
        { provide: STORAGE, useValue: {} as FirebaseStorage },
      ],
    });
    service = TestBed.inject(ExploreSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
