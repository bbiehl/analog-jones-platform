import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Episode } from '../../../../../../libs/episode/episode.model';

@Component({
  selector: 'app-episode-scroller',
  imports: [DatePipe, UpperCasePipe, RouterLink],
  templateUrl: './episode-scroller.html',
  styleUrl: './episode-scroller.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeScroller {
  readonly episodes = input.required<Episode[]>();
  readonly heading = input<string | null>(null);
  readonly eyebrow = input<string | null>(null);
  readonly seeAllLabel = input<string | null>(null);
  readonly seeAllLink = input<string | any[] | null>(null);
  readonly ariaLabel = input<string>('Episodes');
  readonly routerPrefix = input<string>('/episodes');

  protected toDate(episode: Episode): Date {
    return episode.episodeDate.toDate();
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

  private posterColor(episode: Episode): string {
    const id = episode.id ?? episode.title;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 42%)`;
  }
}
