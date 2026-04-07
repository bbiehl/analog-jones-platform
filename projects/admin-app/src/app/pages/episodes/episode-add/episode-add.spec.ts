import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeAdd } from './episode-add';

describe('EpisodeAdd', () => {
  let component: EpisodeAdd;
  let fixture: ComponentFixture<EpisodeAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
