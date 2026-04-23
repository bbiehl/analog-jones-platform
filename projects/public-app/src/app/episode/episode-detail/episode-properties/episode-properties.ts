import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { marked } from 'marked';
import { EpisodeWithRelations } from '../../../../../../../libs/episode/episode.model';

@Component({
  selector: 'app-episode-properties',
  imports: [DatePipe],
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

  protected episodeDate(): Date {
    return this.episode().episodeDate.toDate();
  }
}
