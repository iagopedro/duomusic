import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../core/i18n/i18n.service';
import { ProgressService } from '../../core/services/progress.service';
import { ApiService } from '../../core/services/api.service';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';
import { XpBarComponent } from '../../shared/components/xp-bar/xp-bar.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { BadgeChipComponent } from '../../shared/components/badge-chip/badge-chip.component';
import { Module, ModuleId } from '../../core/models';
import { JourneyLesson, JourneyService } from '../../core/services/journey.service';

@Component({
  selector: 'app-home',
  imports: [
    MatIconModule,
    GlassPanelComponent,
    XpBarComponent,
    PrimaryButtonComponent,
    BadgeChipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly api = inject(ApiService);
  private readonly progress = inject(ProgressService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);
  private readonly journey = inject(JourneyService);
  readonly freeModule = signal<ModuleId>('fundamentals');
  readonly path = computed(() =>
    this.modules().map((module) => ({ module, lessons: this.journey.lessons(module.id) })),
  );
  readonly reviewModule = computed(() => this.journey.reviewModule());
  readonly reviewName = computed(() => {
    const module = this.modules().find((module) => module.id === this.reviewModule());
    return module ? this.i18n.tStr(module.nameKey) : '';
  });
  readonly completedLessons = computed(() =>
    this.path().reduce(
      (count, unit) => count + unit.lessons.filter((lesson) => lesson.completed).length,
      0,
    ),
  );
  readonly totalLessons = computed(() =>
    this.path().reduce((count, unit) => count + unit.lessons.length, 0),
  );
  readonly completedMissions = computed(
    () => this.missions().filter((mission) => mission.completed).length,
  );
  readonly nextStop = computed(() => {
    for (const unit of this.path()) {
      const lesson = unit.lessons.find((lesson) => lesson.unlocked && !lesson.completed);
      if (lesson) return { module: unit.module, lesson };
    }
    return null;
  });

  lessonReward(lesson: JourneyLesson): number {
    const moduleId = lesson.exercises[0]?.moduleId;
    return moduleId
      ? this.journey
          .prepare(lesson, moduleId, 'guided')
          .reduce((xp, exercise) => xp + exercise.xpReward, 0)
      : 0;
  }

  readonly modules = this.api.modules;

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
    const mods = this.api.modules();
    const next = mods.find(
      (m) => !this.progress.isModuleCompleted(m.id) && this.progress.isModuleUnlocked(m.id),
    );
    const id = next?.id ?? 'fundamentals';
    this.router.navigate(['/practice', id]);
  }

  openModule(mod: Module): void {
    if (this.progress.isModuleUnlocked(mod.id)) {
      this.router.navigate(['/practice', mod.id]);
    }
  }

  openLesson(module: Module, lesson: JourneyLesson): void {
    if (lesson.unlocked)
      this.router.navigate(['/practice', module.id], { queryParams: { lesson: lesson.index } });
  }

  selectFreeModule(value: string): void {
    const module = this.modules().find((module) => module.id === value);
    if (module) this.freeModule.set(module.id);
  }

  startFreePractice(): void {
    this.router.navigate(['/practice', this.freeModule()], { queryParams: { mode: 'free' } });
  }

  startReview(): void {
    const moduleId = this.reviewModule();
    if (moduleId)
      this.router.navigate(['/practice', moduleId], { queryParams: { mode: 'review' } });
  }

  requirement(module: Module): string {
    const previous = this.modules().find((candidate) => candidate.id === module.requiredModuleId);
    return this.i18n.t('journey.path.requirement', {
      module: previous ? this.i18n.tStr(previous.nameKey) : '',
      xp: module.minXpToUnlock,
    });
  }
}
