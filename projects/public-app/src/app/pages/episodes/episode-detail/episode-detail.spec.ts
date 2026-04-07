import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeDetail } from './episode-detail';

describe('EpisodeDetail', () => {
  let component: EpisodeDetail;
  let fixture: ComponentFixture<EpisodeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
