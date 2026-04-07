import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeEdit } from './episode-edit';

describe('EpisodeEdit', () => {
  let component: EpisodeEdit;
  let fixture: ComponentFixture<EpisodeEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
