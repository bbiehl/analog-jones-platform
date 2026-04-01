import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tags {}
