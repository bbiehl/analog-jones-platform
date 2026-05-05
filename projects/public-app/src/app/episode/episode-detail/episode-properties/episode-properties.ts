import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { marked } from 'marked';
import { EpisodeWithRelations } from '@aj/core';

@Component({
  selector: 'app-episode-properties',
  imports: [DatePipe, UpperCasePipe],
  templateUrl: './episode-properties.html',
  styleUrl: './episode-properties.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeProperties {
  readonly episode = input.required<EpisodeWithRelations>();

  protected readonly intelligenceHtml = computed<string | null>(() => {
    const raw = this.episode().intelligence;
    if (!raw) return null;
    return marked.parse(raw) as string;
  });

  protected readonly episodeDate = computed<Date>(() => this.episode().episodeDate.toDate());

  protected readonly hasLinks = computed(() => {
    const links = this.episode().links;
    return !!(links.spotify || links.youtube);
  });

  protected readonly sleeveBackground = computed<string>(() => {
    const ep = this.episode();
    if (ep.posterUrl) {
      return `url('${ep.posterUrl}') center/cover no-repeat, #050509`;
    }
    const color = this.sleeveColor(ep.id ?? ep.title);
    return `
      linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.85) 100%),
      radial-gradient(ellipse at 30% 20%, ${color}55, transparent 55%),
      radial-gradient(ellipse at 80% 70%, #00000088, transparent 60%),
      repeating-linear-gradient(135deg, ${color}22 0 8px, #0a0612 8px 16px),
      #140a22
    `;
  });

  private sleeveColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 42%)`;
  }
}
