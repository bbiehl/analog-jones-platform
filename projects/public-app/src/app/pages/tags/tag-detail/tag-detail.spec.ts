import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagDetail } from './tag-detail';

describe('TagDetail', () => {
  let component: TagDetail;
  let fixture: ComponentFixture<TagDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(TagDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
