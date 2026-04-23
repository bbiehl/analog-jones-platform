import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodePropertiesSkeleton } from './episode-properties-skeleton';

describe('EpisodePropertiesSkeleton', () => {
  let component: EpisodePropertiesSkeleton;
  let fixture: ComponentFixture<EpisodePropertiesSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodePropertiesSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodePropertiesSkeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
