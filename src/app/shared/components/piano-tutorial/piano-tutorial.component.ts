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
  template: `
    @if (visible()) {
      <div class="piano-tutorial__overlay" [@overlay] (click)="confirm()">
        <div class="piano-tutorial__modal" [@modal] (click)="$event.stopPropagation()">
          <h2 class="piano-tutorial__title">{{ i18n.t('piano.tutorial.title') }}</h2>
          <p class="piano-tutorial__subtitle">{{ i18n.t('piano.tutorial.subtitle') }}</p>

          <app-piano-keyboard [showKeyboardHints]="true" [disabled]="true" />

          <div class="piano-tutorial__key-grid">
            @for (key of allKeys; track key.note) {
              <div class="piano-tutorial__key-item" [class.piano-tutorial__key-item--black]="key.isBlack">
                <kbd class="piano-tutorial__kbd">{{ key.keyboardKey.toUpperCase() }}</kbd>
                <span class="piano-tutorial__arrow">→</span>
                <span class="piano-tutorial__note">{{ key.note }}</span>
              </div>
            }
          </div>

          <app-primary-button
            style="width: 100%"
            (clicked)="confirm()"
            [ariaLabel]="i18n.t('piano.tutorial.confirm')"
          >{{ i18n.t('piano.tutorial.confirm') }}</app-primary-button>
        </div>
      </div>
    }
  `,
  styles: [`
    .piano-tutorial {
      &__overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        backdrop-filter: blur(4px);
      }

      &__modal {
        background: var(--color-surface, #1a1a2e);
        border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
        border-radius: var(--radius-lg, 16px);
        padding: 1.5rem;
        max-width: 480px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      &__title {
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--color-on-surface, #fff);
        text-align: center;
        margin: 0;
      }

      &__subtitle {
        font-size: 0.9rem;
        color: var(--color-on-surface-muted, #aaa);
        text-align: center;
        margin: 0;
      }

      &__key-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 0.4rem;
      }

      &__key-item {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.5rem;
        border-radius: 6px;
        background: var(--glass-bg, rgba(255,255,255,0.05));
        font-size: 0.8rem;

        &--black {
          background: rgba(255, 255, 255, 0.08);
        }
      }

      &__kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.5rem;
        height: 1.5rem;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.1);
        color: var(--color-primary, #6366f1);
        font-weight: 700;
        font-size: 0.75rem;
        font-family: inherit;
      }

      &__arrow {
        color: var(--color-on-surface-muted, #aaa);
        font-size: 0.7rem;
      }

      &__note {
        color: var(--color-on-surface, #fff);
        font-weight: 600;
        font-size: 0.8rem;
      }
    }
  `],
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
