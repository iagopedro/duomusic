import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Achievement } from '../../../core/models';

@Component({
  selector: 'app-badge-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge-chip.component.html',
  styleUrl: './badge-chip.component.scss',
})
export class BadgeChipComponent {
  readonly achievement = input.required<Achievement>();
  readonly locked = input(false);
}
