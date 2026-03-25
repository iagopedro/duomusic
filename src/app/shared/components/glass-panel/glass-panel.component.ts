import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-glass-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './glass-panel.component.html',
  styleUrl: './glass-panel.component.scss',
})
export class GlassPanelComponent {
  @Input() panelClass = '';
  @Input() padding = '1.25rem';
}
