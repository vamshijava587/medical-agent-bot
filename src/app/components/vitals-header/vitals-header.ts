import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-vitals-header',
  imports: [],
  templateUrl: './vitals-header.html',
  styleUrl: './vitals-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VitalsHeader {
  readonly active = input<boolean>(false);
  readonly connected = input<boolean>(true);
  readonly sessionTitle = input<string>('New consultation');
}
