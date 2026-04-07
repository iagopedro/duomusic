import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-glass-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './glass-panel.component.html',
  styleUrl: './glass-panel.component.scss',
})
export class GlassPanelComponent {
  readonly panelClass = input('');
  readonly padding = input('1.25rem');
}
