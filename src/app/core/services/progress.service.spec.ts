import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProgressService } from './progress.service';
import { StorageService } from '../storage/storage.service';
import { ApiService } from './api.service';
import { ExerciseResult } from '../models';
import { MODULES } from '../../data/modules.data';
import { ACHIEVEMENTS } from '../../data/achievements.data';

const DEFAULT_PROGRESS = {
  xp: 0, level: 1, streak: 0, lastPracticeDate: null,
  unlockedModuleIds: ['fundamentals'], completedModuleIds: [],
  earnedAchievementIds: [], exerciseHistory: [],
  dailyMissions: [], dailyMissionsDate: null, totalPracticeMs: 0,
};

function makeResult(overrides: Partial<ExerciseResult> = {}): ExerciseResult {
  return {
    exerciseId: 'r-1', moduleId: 'fundamentals',
    correct: true, xpEarned: 10,
    attemptedAt: Date.now(), durationMs: 1000,
    ...overrides,
  };
}

function makeApiSpy() {
  return {
    modules: signal(MODULES),
    exercises: signal([]),
    achievements: signal(ACHIEVEMENTS),
    getExercisesForModule: vi.fn().mockReturnValue([]),
  };
}

describe('ProgressService', () => {
  let service: ProgressService;
  let storageSpy: ReturnType<typeof vi.fn>;
  let storageSetSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storageSpy = vi.fn().mockReturnValue(DEFAULT_PROGRESS);
    storageSetSpy = vi.fn();
    const storageStub = { get: storageSpy, set: storageSetSpy, remove: vi.fn(), clear: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        ProgressService,
        { provide: StorageService, useValue: storageStub },
        { provide: ApiService, useValue: makeApiSpy() },
      ],
    });
    service = TestBed.inject(ProgressService);
  });

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start at level 1 with 0 XP', () => {
    expect(service.level()).toBe(1);
    expect(service.xp()).toBe(0);
  });

  it('should start with fundamentals unlocked', () => {
    expect(service.isModuleUnlocked('fundamentals')).toBe(true);
  });

  it('should start with other modules locked', () => {
    expect(service.isModuleUnlocked('intervals')).toBe(false);
    expect(service.isModuleUnlocked('chords')).toBe(false);
  });

  // ── XP & Level ──────────────────────────────────────────────────────────

  it('recordResult should add XP and persist', () => {
    service.recordResult(makeResult({ xpEarned: 10 }));
    expect(service.xp()).toBe(30);
    expect(storageSetSpy).toHaveBeenCalled();
  });

  it('level should increase at 100 XP', () => {
    for (let i = 0; i < 10; i++) {
      service.recordResult(makeResult({ exerciseId: `r-${i}`, xpEarned: 10 }));
    }
    expect(service.xp()).toBe(150);
    expect(service.level()).toBe(2);
  });

  it('xpInCurrentLevel should track XP within current level', () => {
    service.recordResult(makeResult({ xpEarned: 50 }));
    expect(service.xpInCurrentLevel()).toBe(70);
  });

  it('xpForNextLevel should be 100', () => {
    expect(service.xpForNextLevel()).toBe(100);
  });

  // ── Accuracy ─────────────────────────────────────────────────────────────

  it('accuracy should be 0 with no history', () => {
    expect(service.accuracy()).toBe(0);
  });

  it('accuracy should compute 50% for 1 correct and 1 wrong', () => {
    service.recordResult(makeResult({ exerciseId: 'r-1', correct: true, xpEarned: 10 }));
    service.recordResult(makeResult({ exerciseId: 'r-2', correct: false, xpEarned: 0 }));
    expect(service.accuracy()).toBe(50);
  });

  it('accuracy should compute 100% for all correct', () => {
    service.recordResult(makeResult({ correct: true, xpEarned: 10 }));
    expect(service.accuracy()).toBe(100);
  });

  // ── Streak ───────────────────────────────────────────────────────────────

  it('streak should start at 0', () => {
    expect(service.streak()).toBe(0);
  });

  it('recordResult should start streak at 1 on first practice', () => {
    service.recordResult(makeResult());
    expect(service.streak()).toBe(1);
  });

  // ── Module Completion ────────────────────────────────────────────────────

  it('isModuleCompleted should be false initially', () => {
    expect(service.isModuleCompleted('fundamentals')).toBe(false);
  });

  it('completing all exercises in fundamentals should mark it complete and unlock intervals', () => {
    const fundamentals = MODULES.find(m => m.id === 'fundamentals')!;
    fundamentals.exerciseIds.forEach((exId, i) => {
      service.recordResult(makeResult({ exerciseId: exId, moduleId: 'fundamentals', correct: true, xpEarned: 10 }));
    });
    expect(service.isModuleCompleted('fundamentals')).toBe(true);
    expect(service.isModuleUnlocked('intervals')).toBe(true);
  });

  // ── Achievements ─────────────────────────────────────────────────────────

  it('should earn first-exercise achievement after first correct result', () => {
    service.recordResult(makeResult());
    expect(service.earnedAchievementIds()).toContain('first-exercise');
  });

  it('should earn xp-100 achievement when xp reaches 100', () => {
    for (let i = 0; i < 10; i++) {
      service.recordResult(makeResult({ exerciseId: `e-${i}`, xpEarned: 10 }));
    }
    expect(service.earnedAchievementIds()).toContain('xp-100');
  });

  it('getRecentBadges should return at most the requested count', () => {
    service.recordResult(makeResult());
    const badges = service.getRecentBadges(1);
    expect(badges.length).toBeLessThanOrEqual(1);
  });

  // ── Daily Missions ───────────────────────────────────────────────────────

  it('getDailyMissions should return an array', () => {
    expect(Array.isArray(service.getDailyMissions())).toBe(true);
  });

  it('credits mission rewards once, including the five-exercise mission', () => {
    for (let attempt = 0; attempt < 5; attempt++) service.recordResult(makeResult({ xpEarned: 0 }));
    expect(service.xp()).toBe(50);
    service.recordResult(makeResult({ xpEarned: 0 }));
    expect(service.xp()).toBe(50);
  });

  it('requires minimum XP and rechecks unlocks after a completed module', () => {
    const fundamentals = MODULES.find(module => module.id === 'fundamentals')!;
    const api = TestBed.inject(ApiService);
    const modules = api.modules as ReturnType<typeof signal<typeof MODULES>>;
    modules.set(MODULES.map(module => module.id === 'intervals' ? { ...module, minXpToUnlock: 200 } : module));
    for (const exerciseId of fundamentals.exerciseIds) service.recordResult(makeResult({ exerciseId, xpEarned: 0 }));
    expect(service.isModuleCompleted('fundamentals')).toBe(true);
    expect(service.isModuleUnlocked('intervals')).toBe(false);
    service.recordResult(makeResult({ exerciseId: 'free-training', xpEarned: 150 }));
    expect(service.isModuleUnlocked('intervals')).toBe(true);
  });
});
