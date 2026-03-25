import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../core/i18n/i18n.service';
import { ProgressService } from '../../core/services/progress.service';
import { ACHIEVEMENTS } from '../../data/achievements.data';
import { BadgeChipComponent } from '../../shared/components/badge-chip/badge-chip.component';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, BadgeChipComponent, GlassPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './achievements.component.html',
  styleUrl: './achievements.component.scss',
})
export class AchievementsComponent {
  readonly allAchievements = ACHIEVEMENTS;

  readonly earnedCount = computed(() => this.progress.earnedAchievementIds().length);
  readonly total = computed(() => ACHIEVEMENTS.length);
  readonly percentage = computed(() => (this.earnedCount() / this.total()) * 100);

  constructor(
    readonly i18n: I18nService,
    private readonly progress: ProgressService,
  ) {}

  isEarned(id: string): boolean {
    return this.progress.earnedAchievementIds().includes(id);
  }

  trackById(_: number, item: { id: string }): string { return item.id; }
}
