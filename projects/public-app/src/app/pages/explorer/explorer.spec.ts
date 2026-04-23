import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Explorer } from './explorer';
import { ExploreSearchStore } from '../../explore/explore-search.store';

describe('Explorer', () => {
  let component: Explorer;
  let fixture: ComponentFixture<Explorer>;

  const mockStore = {
    autoCompleteOptions: signal([]),
    selectedSearchOption: signal(null),
    results: signal([]),
    isLoading: signal(false),
    error: signal(null),
    loadAutoCompleteOptions: vi.fn().mockResolvedValue(undefined),
    selectSearchOption: vi.fn().mockResolvedValue(undefined),
    searchEpisodes: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Explorer],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ExploreSearchStore, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Explorer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load autocomplete options on init', () => {
    expect(mockStore.loadAutoCompleteOptions).toHaveBeenCalled();
  });
});
