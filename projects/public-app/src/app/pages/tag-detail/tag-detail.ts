import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-tag-detail',
  imports: [AsyncPipe],
  templateUrl: './tag-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagDetail {
  private readonly route = inject(ActivatedRoute);
  protected readonly tagId$ = this.route.paramMap.pipe(map((params) => params.get('id')));
}
