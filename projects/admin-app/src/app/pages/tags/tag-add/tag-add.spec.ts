import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagAdd } from './tag-add';

describe('TagAdd', () => {
  let component: TagAdd;
  let fixture: ComponentFixture<TagAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(TagAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
