import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenreBulkEdit } from './genre-bulk-edit';

describe('GenreBulkEdit', () => {
  let component: GenreBulkEdit;
  let fixture: ComponentFixture<GenreBulkEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreBulkEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(GenreBulkEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
