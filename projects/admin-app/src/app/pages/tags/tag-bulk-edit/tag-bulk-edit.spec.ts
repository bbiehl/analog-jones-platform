import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagBulkEdit } from './tag-bulk-edit';

describe('TagBulkEdit', () => {
  let component: TagBulkEdit;
  let fixture: ComponentFixture<TagBulkEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagBulkEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(TagBulkEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
