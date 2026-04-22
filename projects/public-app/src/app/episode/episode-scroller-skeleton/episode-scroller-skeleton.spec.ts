import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpisodeScrollerSkeleton } from './episode-scroller-skeleton';

describe('EpisodeScrollerSkeleton', () => {
  let component: EpisodeScrollerSkeleton;
  let fixture: ComponentFixture<EpisodeScrollerSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeScrollerSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeScrollerSkeleton);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders an aria-busy region labeled for loading', () => {
    const region = fixture.nativeElement.querySelector('[aria-busy="true"]');
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-label')).toBe('Loading episodes');
  });

  it('renders a shelf of poster placeholders that match the scroller footprint', () => {
    const items = fixture.nativeElement.querySelectorAll('.shelf .shelf-item');
    expect(items.length).toBe(6);
    const posters = fixture.nativeElement.querySelectorAll('.shelf .poster');
    expect(posters.length).toBe(6);
  });

  it('renders a heading placeholder', () => {
    expect(fixture.nativeElement.querySelector('.skeleton-heading')).toBeTruthy();
  });
});
