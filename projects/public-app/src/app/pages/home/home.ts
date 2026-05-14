import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, UpperCasePipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { Episode } from '@aj/core';
import { EpisodeStore } from '@aj/core';
import { EpisodeScroller } from '../../episode/episode-scroller/episode-scroller';

const INTELLIGENCE_PREVIEW_CHARS = 600;

interface Host {
  init: string;
  name: string;
  role: string;
  line: string;
}

@Component({
  selector: 'app-home',
  imports: [DatePipe, UpperCasePipe, RouterLink, EpisodeScroller],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'home-page' },
})
export class Home implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly episodeStore = inject(EpisodeStore);

  private readonly markedParse = signal<((src: string) => string) | null>(null);

  protected readonly episodes = computed(() => this.episodeStore.episodes());
  protected readonly totalVisible = computed(() => this.episodeStore.totalVisible());
  protected readonly featured = computed<Episode | null>(() => this.episodes()[0] ?? null);
  protected readonly shelfEpisodes = computed(() => this.episodes().slice(1, 9));
  protected readonly featuredDetails = computed(() => {
    const selected = this.episodeStore.selectedEpisode();
    const featured = this.featured();
    return selected && featured && selected.id === featured.id ? selected : null;
  });
  protected readonly featuredIntelligence = computed<string | null>(() => {
    const raw = this.featured()?.intelligence;
    const parse = this.markedParse();
    if (!raw || !parse) return null;
    const trimmed = this.trimMarkdown(raw, INTELLIGENCE_PREVIEW_CHARS);
    return parse(trimmed);
  });

  protected readonly hosts: Host[] = [
    {
      init: 'ST',
      name: "Stephen 'Head Cleaner' ",
      role: 'FOUNDER · HOST',
      line: 'Started Analog Jones and still runs the original signal. The voice behind the first drop.',
    },
    {
      init: 'CH',
      name: "Chris 'Ogre Mode' ",
      role: 'WEIRD · ANIME',
      line: 'Treats Shrek like scripture and anime like a second language. The stranger the tape, the better.',
    },
    {
      init: 'BR',
      name: "Brad 'Highlander' ",
      role: 'ACTION · CODE',
      line: "80s action kid who built the site. There can be only one — and it's usually Connor MacLeod.",
    },
  ];

  private readonly tapeSeconds = signal(0);
  protected readonly tapeCounter = computed(() => {
    const t = this.tapeSeconds();
    const hh = String(Math.floor(t / 3600)).padStart(2, '0');
    const mm = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  });

  ngOnInit(): void {
    this.episodeStore.loadHomeData();

    if (!this.isBrowser) return;
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tapeSeconds.update((v) => v + 1));

    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
        .requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    idle(() => {
      this.host.nativeElement.classList.add('warm');
      import('marked').then((m) => this.markedParse.set((src) => m.marked.parse(src) as string));
    });
  }

  protected pad(n: number, width = 3): string {
    return String(n).padStart(width, '0');
  }

  private trimMarkdown(raw: string, limit: number): string {
    if (raw.length <= limit) return raw;
    const slice = raw.slice(0, limit);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastSpace > limit * 0.6 ? slice.slice(0, lastSpace) : slice;
    return `${cut.trimEnd()}…`;
  }

  protected toDate(episode: Episode): Date {
    return episode.episodeDate.toDate();
  }

  protected posterColor(episode: Episode): string {
    const id = episode.id ?? episode.title;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 42%)`;
  }

  protected posterBg(episode: Episode): string {
    if (episode.posterUrl) {
      return `
        url('${episode.posterUrl}') center/contain no-repeat,
        #050509
      `;
    }
    const color = this.posterColor(episode);
    return `
      linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.8) 100%),
      radial-gradient(ellipse at 30% 20%, ${color}55, transparent 55%),
      radial-gradient(ellipse at 80% 70%, #00000088, transparent 60%),
      repeating-linear-gradient(135deg, ${color}22 0 8px, #0a0612 8px 16px),
      #140a22
    `;
  }

  protected monitorGlow(episode: Episode): string {
    const color = this.posterColor(episode);
    return `
      radial-gradient(ellipse at 30% 30%, ${color}99, transparent 60%),
      radial-gradient(ellipse at 70% 80%, #00000099, transparent 60%)
    `;
  }
}
