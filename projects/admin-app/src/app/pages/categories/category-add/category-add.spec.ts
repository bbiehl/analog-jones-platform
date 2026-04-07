import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryAdd } from './category-add';

describe('CategoryAdd', () => {
  let component: CategoryAdd;
  let fixture: ComponentFixture<CategoryAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
