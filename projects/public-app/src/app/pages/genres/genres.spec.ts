import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Genres } from './genres';

describe('Genres', () => {
  let component: Genres;
  let fixture: ComponentFixture<Genres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Genres],
    }).compileComponents();

    fixture = TestBed.createComponent(Genres);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
