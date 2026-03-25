import { TestBed } from '@angular/core/testing';
import { ProgressService } from './progress.service';
import { StorageService } from '../storage/storage.service';
import { ExerciseResult } from '../models';

describe('ProgressService', () => {
  let service: ProgressService;
  const storageSpy = jasmine.createSpyObj<StorageService>('StorageService', ['get', 'set']);

  beforeEach(() => {
    storageSpy.get.and.returnValue({
      xp: 0, level: 1, streak: 0, lastPracticeDate: null,
      unlockedModuleIds: ['fundamentals'], completedModuleIds: [],
      earnedAchievementIds: [], exerciseHistory: [],
      dailyMissions: [], dailyMissionsDate: null, totalPracticeMs: 0,
    });
    TestBed.configureTestingModule({
      providers: [
        ProgressService,
        { provide: StorageService, useValue: storageSpy },
      ],
    });
    service = TestBed.inject(ProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start at level 1 with 0 XP', () => {
    expect(service.level()).toBe(1);
    expect(service.xp()).toBe(0);
  });

  it('recordResult should add XP', () => {
    const result: ExerciseResult = {
      exerciseId: 'r-1',
      moduleId: 'fundamentals',
      correct: true,
      xpEarned: 10,
      attemptedAt: Date.now(),
      durationMs: 5000,
    };
    service.recordResult(result);
    expect(service.xp()).toBe(10);
    expect(storageSpy.set).toHaveBeenCalled();
  });

  it('level should increase at 100 XP', () => {
    for (let i = 0; i < 10; i++) {
      service.recordResult({
        exerciseId: `r-${i}`, moduleId: 'fundamentals',
        correct: true, xpEarned: 10,
        attemptedAt: Date.now(), durationMs: 1000,
      });
    }
    expect(service.xp()).toBe(100);
    expect(service.level()).toBe(2);
  });

  it('isModuleUnlocked should be true for fundamentals by default', () => {
    expect(service.isModuleUnlocked('fundamentals')).toBeTrue();
    expect(service.isModuleUnlocked('chords')).toBeFalse();
  });

  it('accuracy should compute correctly', () => {
    service.recordResult({ exerciseId: 'r-1', moduleId: 'fundamentals', correct: true, xpEarned: 10, attemptedAt: Date.now(), durationMs: 1000 });
    service.recordResult({ exerciseId: 'r-2', moduleId: 'fundamentals', correct: false, xpEarned: 0, attemptedAt: Date.now(), durationMs: 1000 });
    expect(service.accuracy()).toBe(50);
  });
});
