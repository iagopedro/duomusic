import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Achievement } from '../../../core/models';

@Component({
  selector: 'app-badge-chip',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge-chip.component.html',
  styleUrl: './badge-chip.component.scss',
})
export class BadgeChipComponent {
  @Input({ required: true }) achievement!: Achievement;
  @Input() locked = false;
}
