import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-xp-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xp-bar.component.html',
  styleUrl: './xp-bar.component.scss',
})
export class XpBarComponent {
  @Input() current = 0;
  @Input() max = 100;
  @Input() showLabels = false;
  @Input() ariaLabel = 'XP';

  get percentage(): number {
    if (this.max <= 0) return 0;
    return Math.min(100, (this.current / this.max) * 100);
  }
}
