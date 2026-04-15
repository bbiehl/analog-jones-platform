import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { EpisodeStore } from '../../../../../../libs/episode/episode.store';
import { Episodes } from './episodes';

describe('Episodes', () => {
  let component: Episodes;
  let fixture: ComponentFixture<Episodes>;
  let loader: HarnessLoader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEpisodeStore: any;

  beforeEach(async () => {
    mockEpisodeStore = {
      loading: vi.fn(() => false),
      error: vi.fn(() => null),
      episodes: vi.fn(() => []),
      loadEpisodes: vi.fn(),
      deleteEpisode: vi.fn().mockResolvedValue(undefined),
      toggleEpisodeVisibility: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Episodes],
      providers: [
        provideRouter([]),
        { provide: EpisodeStore, useValue: mockEpisodeStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Episodes);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load episodes on init', () => {
    expect(mockEpisodeStore.loadEpisodes).toHaveBeenCalled();
  });

  it('should display the "Episodes" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Episodes');
  });

  it('should have an "Add Episode" button', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Episode/ }));
    expect(button).toBeTruthy();
  });

  it('should navigate to /episodes/add on add button click', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const button = await loader.getHarness(MatButtonHarness.with({ text: /Add Episode/ }));

    await button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/episodes/add']);
  });
});
