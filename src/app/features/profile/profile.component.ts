import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../core/i18n/i18n.service';
import { ProgressService } from '../../core/services/progress.service';
import { SettingsService } from '../../core/services/settings.service';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatSliderModule, MatSlideToggleModule, MatIconModule,
    GlassPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly progress = inject(ProgressService);
  private readonly settingsSvc = inject(SettingsService);
  readonly i18n = inject(I18nService);

  readonly accuracy = this.progress.accuracy;
  readonly streak = this.progress.streak;
  readonly xp = this.progress.xp;
  readonly exerciseCount = computed(() => this.progress.progress().exerciseHistory.length);
  readonly practiceMinutes = computed(() =>
    Math.round(this.progress.progress().totalPracticeMs / 60000)
  );

  readonly volume = computed(() => this.settingsSvc.settings().volume);
  readonly reduceAnimations = computed(() => this.settingsSvc.settings().reduceAnimations);
  readonly darkTheme = computed(() => this.settingsSvc.settings().darkTheme);

  onVolumeChange(value: number): void {
    this.settingsSvc.setVolume(value);
  }

  onReduceAnimations(value: boolean): void {
    this.settingsSvc.setReduceAnimations(value);
  }

  onDarkTheme(value: boolean): void {
    this.settingsSvc.setDarkTheme(value);
  }
}
