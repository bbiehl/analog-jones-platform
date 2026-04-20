import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryBulkEdit } from './category-bulk-edit';

describe('CategoryBulkEdit', () => {
  let component: CategoryBulkEdit;
  let fixture: ComponentFixture<CategoryBulkEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryBulkEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBulkEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
