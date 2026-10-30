import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { I18nService } from '../../core/i18n/i18n.service';
import { StorageService } from '../../core/storage/storage.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';

interface OnboardingStep {
  titleKey: string;
  descKey: string;
  illustration: string;
}

@Component({
  selector: 'app-onboarding',
  imports: [MatIconModule, PrimaryButtonComponent, GlassPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition(':increment', [
        group([
          query(
            ':leave',
            [
              style({ position: 'absolute', width: '100%' }),
              animate('300ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 })),
            ],
            { optional: true },
          ),
          query(
            ':enter',
            [
              style({ transform: 'translateX(100%)', opacity: 0 }),
              animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
            ],
            { optional: true },
          ),
        ]),
      ]),
      transition(':decrement', [
        group([
          query(
            ':leave',
            [
              style({ position: 'absolute', width: '100%' }),
              animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 })),
            ],
            { optional: true },
          ),
          query(
            ':enter',
            [
              style({ transform: 'translateX(-100%)', opacity: 0 }),
              animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
            ],
            { optional: true },
          ),
        ]),
      ]),
    ]),
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  readonly i18n = inject(I18nService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  readonly steps: OnboardingStep[] = [
    {
      titleKey: 'onboarding.step1.title',
      descKey: 'onboarding.step1.desc',
      illustration: 'piano',
    },
    {
      titleKey: 'onboarding.step2.title',
      descKey: 'onboarding.step2.desc',
      illustration: 'hearing',
    },
    {
      titleKey: 'onboarding.step3.title',
      descKey: 'onboarding.step3.desc',
      illustration: 'workspace_premium',
    },
  ];

  readonly currentIndex = signal(0);
  readonly currentStep = computed(() => this.steps[this.currentIndex()]);
  readonly isLast = computed(() => this.currentIndex() === this.steps.length - 1);
  readonly stepTitle = computed(() => this.i18n.tStr(this.currentStep().titleKey));
  readonly stepDesc = computed(() => this.i18n.tStr(this.currentStep().descKey));

  next(): void {
    if (!this.isLast()) this.currentIndex.update((i) => i + 1);
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
  }

  finish(): void {
    this.storage.set('duomusic_onboarding_done', true);
    this.router.navigate(['/home']);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
