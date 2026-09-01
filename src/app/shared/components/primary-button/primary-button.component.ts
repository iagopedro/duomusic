import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-primary-button',
  imports: [MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './primary-button.component.html',
  styleUrl: './primary-button.component.scss',
})
export class PrimaryButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'outline'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Onda de luz periódica e discreta, para chamar atenção sem ser intrusivo (ex: CTA principal). */
  readonly sweep = input(false);
  readonly clicked = output<MouseEvent>();
}
