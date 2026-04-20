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
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

interface HomeEpisode {
  n: number;
  date: string;
  decade: string;
  title: string;
  tagline?: string;
  tags: string[];
  genres: string[];
  runtime: string;
  where: ('spotify' | 'youtube')[];
  color: string;
}

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

interface RelatedGroup {
  tag: string;
  ids: number[];
  hue: 'cyan' | 'accent' | 'amber';
  blurb: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'home-page' },
})
export class Home implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly episodes: HomeEpisode[] = [
    {
      n: 47,
      date: 'APR 18 · 2026',
      decade: '1987',
      title: 'The Last Dragon',
      tagline:
        "Sho'nuff vs. Bruce Leroy — the Berry Gordy curio that shouldn't work, and does.",
      tags: ['KUNG-FU', 'CULT', 'MOTOWN'],
      genres: ['Action', 'Musical'],
      runtime: '1:12:04',
      where: ['spotify', 'youtube'],
      color: '#6d2bff',
    },
    {
      n: 46,
      date: 'APR 11 · 2026',
      decade: '1983',
      title: 'Krull',
      tags: ['FANTASY', 'SYFY', 'QUEST'],
      genres: ['Fantasy'],
      runtime: '58:31',
      where: ['spotify'],
      color: '#2b3aff',
    },
    {
      n: 45,
      date: 'APR 04 · 2026',
      decade: '1990',
      title: 'Hardware',
      tags: ['POST-APOC', 'INDIE', 'GRIM'],
      genres: ['Sci-Fi', 'Horror'],
      runtime: '1:04:17',
      where: ['spotify', 'youtube'],
      color: '#b42b2b',
    },
    {
      n: 44,
      date: 'MAR 28 · 2026',
      decade: '1985',
      title: 'The Stuff',
      tags: ['BODY-HORROR', 'SATIRE'],
      genres: ['Horror'],
      runtime: '49:52',
      where: ['spotify'],
      color: '#caa04a',
    },
    {
      n: 43,
      date: 'MAR 21 · 2026',
      decade: '1981',
      title: 'Escape from New York',
      tags: ['CARPENTER', 'DYSTOPIA'],
      genres: ['Action', 'Sci-Fi'],
      runtime: '1:18:10',
      where: ['spotify', 'youtube'],
      color: '#2b6d63',
    },
    {
      n: 42,
      date: 'MAR 14 · 2026',
      decade: '1988',
      title: 'They Live',
      tags: ['CARPENTER', 'SATIRE'],
      genres: ['Sci-Fi'],
      runtime: '1:06:40',
      where: ['spotify', 'youtube'],
      color: '#3a8f5f',
    },
    {
      n: 41,
      date: 'MAR 07 · 2026',
      decade: '1984',
      title: 'Streets of Fire',
      tags: ['ROCK', 'NEON', 'NOIR'],
      genres: ['Musical', 'Action'],
      runtime: '1:00:59',
      where: ['spotify'],
      color: '#ff3d7f',
    },
    {
      n: 40,
      date: 'FEB 28 · 2026',
      decade: '1979',
      title: 'The Warriors',
      tags: ['CULT', 'GANG'],
      genres: ['Action'],
      runtime: '1:15:22',
      where: ['spotify', 'youtube'],
      color: '#a83232',
    },
  ];

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

  protected readonly relatedGroups: RelatedGroup[] = [
    {
      tag: 'CARPENTER',
      ids: [43, 42],
      hue: 'cyan',
      blurb: 'Snake, Snake, and the rooftop shades.',
    },
    {
      tag: 'NEON',
      ids: [41, 44],
      hue: 'accent',
      blurb: 'Hot pink, wet streets, impractical jackets.',
    },
    {
      tag: 'QUEST',
      ids: [46, 40],
      hue: 'amber',
      blurb: 'One MacGuffin, many punches to the face.',
    },
  ];

  protected readonly featured = this.episodes[0];
  protected readonly shelfEpisodes = this.episodes.slice(1);
  protected readonly episodesById = new Map(this.episodes.map((e) => [e.n, e]));

  private readonly tapeSeconds = signal(0);
  protected readonly tapeCounter = computed(() => {
    const t = this.tapeSeconds();
    const hh = String(Math.floor(t / 3600)).padStart(2, '0');
    const mm = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tapeSeconds.update((v) => v + 1));
  }

  protected pad(n: number, width = 3): string {
    return String(n).padStart(width, '0');
  }

  protected chipTone(tag: string): 'cyan' | 'accent' | null {
    if (tag === 'CARPENTER') return 'cyan';
    if (tag === 'NEON') return 'accent';
    return null;
  }

  protected posterBg(color: string): string {
    return `
      linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.8) 100%),
      radial-gradient(ellipse at 30% 20%, ${color}55, transparent 55%),
      radial-gradient(ellipse at 80% 70%, #00000088, transparent 60%),
      repeating-linear-gradient(135deg, ${color}22 0 8px, #0a0612 8px 16px),
      #140a22
    `;
  }

  protected monitorGlow(color: string): string {
    return `
      radial-gradient(ellipse at 30% 30%, ${color}99, transparent 60%),
      radial-gradient(ellipse at 70% 80%, #00000099, transparent 60%)
    `;
  }
}
