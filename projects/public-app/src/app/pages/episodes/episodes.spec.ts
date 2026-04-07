import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Episodes } from './episodes';

describe('Episodes', () => {
  let component: Episodes;
  let fixture: ComponentFixture<Episodes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Episodes],
    }).compileComponents();

    fixture = TestBed.createComponent(Episodes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
