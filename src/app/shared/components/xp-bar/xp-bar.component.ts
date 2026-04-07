import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-xp-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xp-bar.component.html',
  styleUrl: './xp-bar.component.scss',
})
export class XpBarComponent {
  readonly current = input(0);
  readonly max = input(100);
  readonly showLabels = input(false);
  readonly ariaLabel = input('XP');

  readonly percentage = computed(() => {
    if (this.max() <= 0) return 0;
    return Math.min(100, (this.current() / this.max()) * 100);
  });
}
