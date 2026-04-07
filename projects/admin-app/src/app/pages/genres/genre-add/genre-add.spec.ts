import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenreAdd } from './genre-add';

describe('GenreAdd', () => {
  let component: GenreAdd;
  let fixture: ComponentFixture<GenreAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(GenreAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
