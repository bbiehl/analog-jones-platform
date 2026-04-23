import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeProperties } from './episode-properties';

describe('EpisodeProperties', () => {
  let component: EpisodeProperties;
  let fixture: ComponentFixture<EpisodeProperties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeProperties],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeProperties);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
