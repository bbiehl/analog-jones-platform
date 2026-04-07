import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryEdit } from './category-edit';

describe('CategoryEdit', () => {
  let component: CategoryEdit;
  let fixture: ComponentFixture<CategoryEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
