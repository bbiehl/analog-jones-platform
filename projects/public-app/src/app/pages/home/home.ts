import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, UpperCasePipe, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marked } from 'marked';
import { interval } from 'rxjs';
import { Episode } from '../../../../../../libs/episode/episode.model';
import { EpisodeStore } from '../../../../../../libs/episode/episode.store';

const INTELLIGENCE_PREVIEW_CHARS = 600;

interface Host {
  init: string;
  name: string;
  role: string;
  line: string;
}

@Component({
  selector: 'app-home',
  imports: [DatePipe, UpperCasePipe, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'home-page' },
})
export class Home implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly episodeStore = inject(EpisodeStore);

  protected readonly episodes = computed(() => this.episodeStore.episodes());
  protected readonly featured = computed<Episode | null>(() => this.episodes()[0] ?? null);
  protected readonly shelfEpisodes = computed(() => this.episodes().slice(1, 9));
  protected readonly featuredIntelligence = computed<SafeHtml | null>(() => {
    const raw = this.featured()?.intelligence;
    if (!raw) return null;
    const trimmed = this.trimMarkdown(raw, INTELLIGENCE_PREVIEW_CHARS);
    return this.sanitizer.bypassSecurityTrustHtml(marked.parse(trimmed) as string);
  });

  protected readonly hosts: Host[] = [
    {
      init: 'BJ',
      name: "Brennan 'Tape Head' Jones",
      role: 'CURATOR · PROGRAMMING',
      line: 'Runs the shelves, picks the weekly drop, refuses to rewind.',
    },
    {
      init: 'MK',
      name: "Marco 'Tracking' Kade",
      role: 'AUDIO · TRANSFER',
      line: 'Knows every flea market between Tulsa and Trenton. Speaks in TRT.',
    },
    {
      init: 'RP',
      name: "Reggie 'Pan-n-Scan' Park",
      role: 'FIELD · ARCHIVE',
      line: 'Will descend into any basement for a Media Home Entertainment clamshell.',
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
    this.episodeStore.loadVisibleEpisodes();

    if (!this.isBrowser) return;
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tapeSeconds.update((v) => v + 1));
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
