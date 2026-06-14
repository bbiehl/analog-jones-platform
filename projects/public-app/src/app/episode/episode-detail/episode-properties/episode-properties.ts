import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { marked } from 'marked';
import { Episode } from '@aj/core';

@Component({
  selector: 'app-episode-properties',
  imports: [DatePipe, UpperCasePipe],
  templateUrl: './episode-properties.html',
  styleUrl: './episode-properties.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeProperties {
  readonly episode = input.required<Episode>();

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
}
