import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeScroller } from './episode-scroller';

describe('EpisodeScroller', () => {
  let component: EpisodeScroller;
  let fixture: ComponentFixture<EpisodeScroller>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeScroller],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeScroller);
    fixture.componentRef.setInput('episodes', []);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
