import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-episode-detail',
  imports: [AsyncPipe],
  templateUrl: './episode-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeDetail {
  private readonly route = inject(ActivatedRoute);
  protected readonly episodeId$ = this.route.paramMap.pipe(map((params) => params.get('id')));
}
