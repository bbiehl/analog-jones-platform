import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagEdit } from './tag-edit';

describe('TagEdit', () => {
  let component: TagEdit;
  let fixture: ComponentFixture<TagEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(TagEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
