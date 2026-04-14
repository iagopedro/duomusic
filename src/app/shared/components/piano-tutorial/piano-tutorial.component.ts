import {
  Component, ChangeDetectionStrategy, input, output, inject,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PianoKeyboardComponent } from '../piano-keyboard/piano-keyboard.component';
import { ALL_KEYS } from '../piano-keyboard/piano-keyboard.component';
import { PrimaryButtonComponent } from '../primary-button/primary-button.component';

export const TUTORIAL_STORAGE_KEY = 'duomusic_piano_tutorial_seen';

@Component({
  selector: 'app-piano-tutorial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PianoKeyboardComponent, PrimaryButtonComponent],
  animations: [
    trigger('overlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
    trigger('modal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.85)' }),
        animate('280ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' })),
      ]),
    ]),
  ],
  templateUrl: './piano-tutorial.component.html',
  styleUrl: './piano-tutorial.component.scss',
})
export class PianoTutorialComponent {
  readonly visible = input(false);
  readonly closed = output<void>();

  readonly allKeys = ALL_KEYS;

  readonly i18n = inject(I18nService);

  confirm(): void {
    this.closed.emit();
  }
}
