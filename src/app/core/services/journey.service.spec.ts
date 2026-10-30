import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { JourneyService } from './journey.service';
import { ApiService } from './api.service';
import { ProgressService } from './progress.service';
import { EXERCISES } from '../../data/exercises.data';
import { MODULES } from '../../data/modules.data';
import { ExerciseResult } from '../models';
import { theoryForModule } from '../../data/journey.data';
import { ALL_KEYS } from '../../shared/components/piano-keyboard/piano-keyboard.component';

describe('JourneyService', () => {
  const history = signal<{ exerciseHistory: ExerciseResult[] }>({ exerciseHistory: [] });
  let service: JourneyService;

  beforeEach(() => {
    history.set({ exerciseHistory: [] });
    TestBed.configureTestingModule({ providers: [
      { provide: ApiService, useValue: { modules: signal(MODULES), exercises: signal(EXERCISES) } },
      { provide: ProgressService, useValue: { progress: history, isModuleUnlocked: () => true } },
    ] });
    service = TestBed.inject(JourneyService);
  });

  it('preserves curriculum order and gates short lessons on previous mastery', () => {
    const lessons = service.lessons('fundamentals');
    expect(lessons).toHaveLength(5);
    expect(lessons[0].exercises.map(exercise => exercise.id)).toEqual(['n-1', 'n-2', 'r-1']);
    expect(lessons[0].unlocked).toBe(true);
    expect(lessons[1].unlocked).toBe(false);
    history.set({ exerciseHistory: lessons[0].exercises.map(exercise => ({
      exerciseId: exercise.id, moduleId: 'fundamentals', correct: true, xpEarned: 10, attemptedAt: 0, durationMs: 100,
    })) });
    expect(service.nextLesson('fundamentals')?.index).toBe(1);
  });

  it('attributes reused exercises to the mixed module without mutating the catalog', () => {
    expect(service.lessons('mixed')[0].exercises.every(exercise => exercise.moduleId === 'mixed')).toBe(true);
    expect(EXERCISES.find(exercise => exercise.id === 'r-1')?.moduleId).toBe('fundamentals');
  });

  it('interleaves theory and adapts tempo without changing rewards or source data', () => {
    const lesson = service.lessons('fundamentals')[0];
    const exercises = service.prepare(lesson, 'fundamentals', 'guided');
    expect(exercises[1].type).toBe('theory');
    const rhythm = exercises.find(exercise => exercise.type === 'rhythm');
    expect(rhythm?.bpm).toBe(64);
    expect(rhythm?.xpReward).toBe(10);
    expect(EXERCISES.find(exercise => exercise.id === 'r-1')).toMatchObject({ bpm: 80 });
  });

  it('offers valid, distinct theory questions for every module and experience mode', () => {
    for (const module of MODULES) {
      const questions = (['guided', 'standard', 'challenge'] as const).map(mode => theoryForModule(module.id, mode, 0));
      expect(new Set(questions.map(question => question.id)).size).toBe(3);
      for (const question of questions) {
        expect(question.options.filter(option => option === question.answer)).toHaveLength(1);
        expect(new Set(question.options).size).toBe(4);
        expect(question.explanationKey).toBeTruthy();
      }
    }
  });

  it('uses the same pitches as the piano for every note-identification exercise', () => {
    for (const exercise of EXERCISES) {
      if (exercise.type === 'note-id') {
        const key = ALL_KEYS.find(key => key.note === exercise.noteName);
        expect(key).toBeDefined();
        expect(exercise.noteFreq).toBeCloseTo(key!.freq, 4);
      }
    }
  });

  it('stops recommending a weakness once its latest attempt is correct', () => {
    const result: ExerciseResult = { exerciseId: 'i-1', moduleId: 'intervals', correct: false, xpEarned: 0, attemptedAt: 0, durationMs: 100 };
    history.set({ exerciseHistory: [result] });
    expect(service.reviewModule()).toBe('intervals');
    history.set({ exerciseHistory: [result, { ...result, correct: true }] });
    expect(service.reviewModule()).toBeUndefined();
  });

  it('builds a focused review from unresolved catalog exercises', () => {
    history.set({ exerciseHistory: [{ exerciseId: 'i-3', moduleId: 'intervals', correct: false, xpEarned: 0, attemptedAt: 0, durationMs: 100 }] });
    expect(service.reviewLesson('intervals')?.exercises.map(exercise => exercise.id)).toEqual(['i-3']);
  });

  it('resolves a free-practice weakness after a correct curriculum attempt', () => {
    const result: ExerciseResult = { exerciseId: 'free-i-3', moduleId: 'intervals', correct: false, xpEarned: 0, attemptedAt: 0, durationMs: 100 };
    history.set({ exerciseHistory: [result, { ...result, exerciseId: 'i-3', correct: true }] });
    expect(service.reviewModule()).toBeUndefined();
  });
});