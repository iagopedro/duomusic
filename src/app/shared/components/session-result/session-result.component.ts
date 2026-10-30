import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PrimaryButtonComponent } from '../primary-button/primary-button.component';

@Component({
  selector: 'app-session-result',
  imports: [MatIconModule, PrimaryButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-result.component.html',
  styleUrl: './session-result.component.scss',
})
export class SessionResultComponent {
  readonly i18n = inject(I18nService);
  readonly accuracy = input.required<number>();
  readonly xp = input.required<number>();
  readonly mastered = input.required<number>();
  readonly total = input.required<number>();
  readonly combo = input.required<number>();
  readonly stars = input.required<number>();
  readonly continued = output<void>();
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  constructor() {
    effect(() => this.heading()?.nativeElement.focus());
  }
}
