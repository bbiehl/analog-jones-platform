import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenreDetail } from './genre-detail';

describe('GenreDetail', () => {
  let component: GenreDetail;
  let fixture: ComponentFixture<GenreDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(GenreDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
