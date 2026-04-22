import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeScrollerSkeleton } from './episode-scroller-skeleton';

describe('EpisodeScrollerSkeleton', () => {
  let component: EpisodeScrollerSkeleton;
  let fixture: ComponentFixture<EpisodeScrollerSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeScrollerSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeScrollerSkeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
