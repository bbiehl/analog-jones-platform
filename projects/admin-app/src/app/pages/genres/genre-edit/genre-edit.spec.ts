import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenreEdit } from './genre-edit';

describe('GenreEdit', () => {
  let component: GenreEdit;
  let fixture: ComponentFixture<GenreEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(GenreEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
