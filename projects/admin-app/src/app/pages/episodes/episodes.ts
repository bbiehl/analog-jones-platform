import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-episodes',
  templateUrl: './episodes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Episodes {}
