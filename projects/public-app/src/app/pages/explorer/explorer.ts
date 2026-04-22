import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-explorer',
  imports: [],
  templateUrl: './explorer.html',
  styleUrl: './explorer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Explorer {}
