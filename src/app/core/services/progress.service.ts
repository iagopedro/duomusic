import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from '../storage/storage.service';
import {
  UserProgress,
  ExerciseResult,
  ModuleId,
  Achievement,
  DailyMission,
} from '../models';
import { ACHIEVEMENTS } from '../../data/achievements.data';
import { EXERCISES } from '../../data/exercises.data';
import { MODULES } from '../../data/modules.data';

const STORAGE_KEY = 'duomusic_progress';

const XP_PER_LEVEL = 100;

const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  lastPracticeDate: null,
  unlockedModuleIds: ['fundamentals'],
  completedModuleIds: [],
  earnedAchievementIds: [],
  exerciseHistory: [],
  dailyMissions: [],
  dailyMissionsDate: null,
  totalPracticeMs: 0,
};

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly storage = inject(StorageService);

  private readonly _progress = signal<UserProgress>(
    this.storage.get(STORAGE_KEY, DEFAULT_PROGRESS)
  );

  readonly progress = this._progress.asReadonly();

  readonly level = computed(() => this._progress().level);
  readonly xp = computed(() => this._progress().xp);
  readonly streak = computed(() => this._progress().streak);
  readonly unlockedModules = computed(() => this._progress().unlockedModuleIds);
  readonly earnedAchievementIds = computed(() => this._progress().earnedAchievementIds);

  readonly xpInCurrentLevel = computed(() => {
    const p = this._progress();
    return p.xp - (p.level - 1) * XP_PER_LEVEL;
  });

  readonly xpForNextLevel = computed(() => XP_PER_LEVEL);

  readonly accuracy = computed(() => {
    const history = this._progress().exerciseHistory;
    if (!history.length) return 0;
    const correct = history.filter(r => r.correct).length;
    return Math.round((correct / history.length) * 100);
  });

  constructor() {
    this.checkStreak();
    this.refreshDailyMissions();
  }

  recordResult(result: ExerciseResult): void {
    this._progress.update(p => {
      const history = [...p.exerciseHistory, result];
      const xp = p.xp + result.xpEarned;
      const level = Math.floor(xp / XP_PER_LEVEL) + 1;
      const updated: UserProgress = {
        ...p,
        xp,
        level,
        exerciseHistory: history,
        totalPracticeMs: p.totalPracticeMs + result.durationMs,
      };
      return updated;
    });

    this.updateStreak();
    this.checkModuleCompletion(result.moduleId);
    this.checkAchievements();
    this.updateDailyMissions(result);
    this.save();
  }

  isModuleUnlocked(moduleId: ModuleId): boolean {
    return this._progress().unlockedModuleIds.includes(moduleId);
  }

  isModuleCompleted(moduleId: ModuleId): boolean {
    return this._progress().completedModuleIds.includes(moduleId);
  }

  getRecentBadges(count = 3): Achievement[] {
    const ids = this._progress().earnedAchievementIds.slice(-count);
    return ACHIEVEMENTS.filter(a => ids.includes(a.id));
  }

  getDailyMissions(): DailyMission[] {
    return this._progress().dailyMissions;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private updateStreak(): void {
    const today = this.todayStr();
    this._progress.update(p => {
      const last = p.lastPracticeDate;
      let streak = p.streak;
      if (last === today) return p; // already counted today
      if (last === this.yesterdayStr()) {
        streak += 1;
      } else {
        streak = 1;
      }
      return { ...p, streak, lastPracticeDate: today };
    });
  }

  private checkStreak(): void {
    const today = this.todayStr();
    this._progress.update(p => {
      if (!p.lastPracticeDate) return p;
      // More than 1 day gap → reset streak
      const last = new Date(p.lastPracticeDate);
      const diff = (new Date(today).getTime() - last.getTime()) / 86400000;
      if (diff > 1) return { ...p, streak: 0 };
      return p;
    });
    this.save();
  }

  private checkModuleCompletion(moduleId: ModuleId): void {
    const module = MODULES.find(m => m.id === moduleId);
    if (!module) return;
    const p = this._progress();
    if (p.completedModuleIds.includes(moduleId)) return;

    const exercisesDone = new Set(
      p.exerciseHistory.filter(r => r.correct && r.moduleId === moduleId).map(r => r.exerciseId)
    );
    const allDone = module.exerciseIds.every(id => exercisesDone.has(id));
    if (!allDone) return;

    // Marca módulo como concluído e desbloqueia o próximo
    this._progress.update(prev => {
      const completedModuleIds = [...prev.completedModuleIds, moduleId];
      const nextModule = MODULES.find(m => m.requiredModuleId === moduleId);
      const unlockedModuleIds = nextModule
        ? [...prev.unlockedModuleIds, nextModule.id]
        : prev.unlockedModuleIds;
      return { ...prev, completedModuleIds, unlockedModuleIds };
    });
  }

  private checkAchievements(): void {
    const p = this._progress();
    const earned = new Set(p.earnedAchievementIds);
    const newEarned: string[] = [];

    for (const ach of ACHIEVEMENTS) {
      if (earned.has(ach.id)) continue;
      if (this.conditionMet(ach, p)) newEarned.push(ach.id);
    }

    if (newEarned.length) {
      this._progress.update(prev => ({
        ...prev,
        earnedAchievementIds: [...prev.earnedAchievementIds, ...newEarned],
      }));
    }
  }

  private conditionMet(ach: Achievement, p: UserProgress): boolean {
    const c = ach.condition;
    switch (c.type) {
      case 'xp':
        return p.xp >= c.value;
      case 'streak':
        return p.streak >= c.value;
      case 'exercises_done':
        return p.exerciseHistory.length >= c.value;
      case 'module_complete':
        return c.moduleId ? p.completedModuleIds.includes(c.moduleId) : false;
      case 'accuracy': {
        if (!p.exerciseHistory.length) return false;
        const correct = p.exerciseHistory.filter(r => r.correct).length;
        const acc = (correct / p.exerciseHistory.length) * 100;
        return acc >= c.value;
      }
      default:
        return false;
    }
  }

  private refreshDailyMissions(): void {
    const today = this.todayStr();
    const p = this._progress();
    if (p.dailyMissionsDate === today) return;

    const missions: DailyMission[] = [
      {
        id: 'daily-5',
        descriptionKey: 'Faça 5 exercícios hoje',
        target: 5,
        current: 0,
        completed: false,
        xpReward: 30,
        type: 'exercises_done',
      },
      {
        id: 'daily-streak',
        descriptionKey: 'Mantenha sua sequência',
        target: 1,
        current: p.streak > 0 && p.lastPracticeDate === today ? 1 : 0,
        completed: p.streak > 0 && p.lastPracticeDate === today,
        xpReward: 20,
        type: 'streak',
      },
    ];

    this._progress.update(prev => ({
      ...prev,
      dailyMissions: missions,
      dailyMissionsDate: today,
    }));
    this.save();
  }

  private updateDailyMissions(result: ExerciseResult): void {
    this._progress.update(p => {
      const missions = p.dailyMissions.map(m => {
        if (m.completed) return m;
        if (m.type === 'exercises_done') {
          const current = m.current + 1;
          return { ...m, current, completed: current >= m.target };
        }
        if (m.type === 'streak') {
          return { ...m, current: 1, completed: true };
        }
        return m;
      });
      return { ...p, dailyMissions: missions };
    });
  }

  private save(): void {
    this.storage.set(STORAGE_KEY, this._progress());
  }

  private todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private yesterdayStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
}
