import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { ProgressService } from '../../core/services/progress.service';
import { ACHIEVEMENTS } from '../../data/achievements.data';
import { BadgeChipComponent } from '../../shared/components/badge-chip/badge-chip.component';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';

@Component({
  selector: 'app-achievements',
  imports: [BadgeChipComponent, GlassPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './achievements.component.html',
  styleUrl: './achievements.component.scss',
})
export class AchievementsComponent {
  readonly i18n = inject(I18nService);
  private readonly progress = inject(ProgressService);

  readonly allAchievements = ACHIEVEMENTS;

  readonly earnedCount = computed(() => this.progress.earnedAchievementIds().length);
  readonly total = computed(() => ACHIEVEMENTS.length);
  readonly percentage = computed(() => (this.earnedCount() / this.total()) * 100);

  isEarned(id: string): boolean {
    return this.progress.earnedAchievementIds().includes(id);
  }
}
