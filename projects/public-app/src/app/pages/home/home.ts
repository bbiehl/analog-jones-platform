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
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { Episode } from '../../../../../../libs/episode/episode.model';
import { EpisodeStore } from '../../../../../../libs/episode/episode.store';

interface Host {
  init: string;
  name: string;
  role: string;
  line: string;
}

interface Channel {
  n: string;
  title: string;
  desc: string;
  path: string;
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
  protected readonly episodeStore = inject(EpisodeStore);

  protected readonly episodes = computed(() => this.episodeStore.episodes());
  protected readonly featured = computed<Episode | null>(() => this.episodes()[0] ?? null);
  protected readonly shelfEpisodes = computed(() => this.episodes().slice(1, 9));

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

  protected readonly channels: Channel[] = [
    {
      n: '02',
      title: 'Categories',
      desc: 'Drive-ins, Midnight, Saturday Mornings, Straight-to-Video…',
      path: '/explorer/categories',
    },
    {
      n: '04',
      title: 'Genres',
      desc: 'Slasher, Kung-fu, Cyberpunk, Dance Movie, Post-Apoc…',
      path: '/explorer/genres',
    },
    {
      n: '11',
      title: 'Tags',
      desc: 'Carpenter, Cannon, Neon, Ninja, Practical FX, VHS-ONLY…',
      path: '/explorer/tags',
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
        linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.8) 100%),
        url('${episode.posterUrl}') center/cover no-repeat,
        #140a22
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
