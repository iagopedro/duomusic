import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../core/i18n/i18n.service';
import { ProgressService } from '../../core/services/progress.service';
import { MODULES } from '../../data/modules.data';
import { ACHIEVEMENTS } from '../../data/achievements.data';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';
import { XpBarComponent } from '../../shared/components/xp-bar/xp-bar.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { ModuleCardComponent } from '../../shared/components/module-card/module-card.component';
import { BadgeChipComponent } from '../../shared/components/badge-chip/badge-chip.component';
import { Module } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    GlassPanelComponent,
    XpBarComponent,
    PrimaryButtonComponent,
    ModuleCardComponent,
    BadgeChipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly modules = MODULES;

  private readonly progress = inject(ProgressService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly level = this.progress.level;
  readonly streak = this.progress.streak;
  readonly xpInLevel = this.progress.xpInCurrentLevel;
  readonly xpForNext = this.progress.xpForNextLevel;

  readonly missions = computed(() => this.progress.getDailyMissions());
  readonly recentBadges = computed(() => this.progress.getRecentBadges(3));

  isUnlocked(mod: Module): boolean {
    return this.progress.isModuleUnlocked(mod.id);
  }

  isCompleted(mod: Module): boolean {
    return this.progress.isModuleCompleted(mod.id);
  }

  continuePractice(): void {
    const next = MODULES.find(m => !this.progress.isModuleCompleted(m.id) && this.progress.isModuleUnlocked(m.id));
    const id = next?.id ?? 'fundamentals';
    this.router.navigate(['/practice', id]);
  }

  openModule(mod: Module): void {
    if (this.progress.isModuleUnlocked(mod.id)) {
      this.router.navigate(['/practice', mod.id]);
    }
  }

  trackById(_: number, item: { id: string }): string { return item.id; }
  trackByModuleId(_: number, mod: Module): string { return mod.id; }
}
