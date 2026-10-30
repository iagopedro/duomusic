import { Injectable, inject } from '@angular/core';
import { Exercise, ModuleId } from '../models';
import { ApiService } from './api.service';
import { ProgressService } from './progress.service';
import { PracticeMode, theoryForModule } from '../../data/journey.data';

export interface JourneyLesson {
  index: number;
  exercises: Exercise[];
  completed: boolean;
  unlocked: boolean;
}

@Injectable({ providedIn: 'root' })
export class JourneyService {
  private readonly api = inject(ApiService);
  private readonly progress = inject(ProgressService);

  lessons(moduleId: ModuleId): JourneyLesson[] {
    const module = this.api.modules().find(module => module.id === moduleId);
    if (!module) return [];
    const catalog = new Map(this.api.exercises().map(exercise => [exercise.id, exercise]));
    const mastered = new Set(this.progress.progress().exerciseHistory
      .filter(result => result.correct && result.moduleId === moduleId)
      .map(result => result.exerciseId));
    const lessons: JourneyLesson[] = [];
    for (let offset = 0; offset < module.exerciseIds.length; offset += 3) {
      const ids = module.exerciseIds.slice(offset, offset + 3);
      const exercises = ids.flatMap(id => {
        const exercise = catalog.get(id);
        return exercise ? [{ ...exercise, moduleId }] : [];
      });
      const completed = ids.every(id => mastered.has(id));
      lessons.push({
        index: lessons.length,
        exercises,
        completed,
        unlocked: this.progress.isModuleUnlocked(moduleId) && exercises.length === ids.length &&
          lessons.every(lesson => lesson.completed),
      });
    }
    return lessons;
  }

  nextLesson(moduleId: ModuleId): JourneyLesson | undefined {
    const lessons = this.lessons(moduleId);
    return lessons.find(lesson => lesson.unlocked && !lesson.completed) ?? lessons.find(lesson => lesson.unlocked);
  }

  prepare(lesson: JourneyLesson, moduleId: ModuleId, mode: PracticeMode): Exercise[] {
    const practical = lesson.exercises.map(exercise => this.adapt(exercise, mode));
    return [...practical.slice(0, 1), theoryForModule(moduleId, mode, lesson.index), ...practical.slice(1)];
  }

  adapt(exercise: Exercise, mode: PracticeMode): Exercise {
    const speed = mode === 'guided' ? 0.8 : mode === 'challenge' ? 1.2 : 1;
    switch (exercise.type) {
      case 'rhythm':
        return { ...exercise, bpm: Math.round(exercise.bpm * speed), toleranceMs: Math.round(exercise.toleranceMs / speed) };
      case 'melody':
        return { ...exercise, bpm: Math.round(exercise.bpm * speed), notes: exercise.notes.map(note => ({ ...note, durationMs: Math.round(note.durationMs / speed) })) };
      case 'note-id':
        return { ...exercise, showHint: mode === 'guided' || (mode === 'standard' && exercise.showHint) };
      case 'chord':
        return { ...exercise, options: mode === 'challenge' ? ['major', 'minor', 'dim', 'aug'] : exercise.options };
      default:
        return { ...exercise };
    }
  }

  reviewModule(): ModuleId | undefined {
    const latest = new Map<string, { moduleId: ModuleId; correct: boolean }>();
    for (const result of this.progress.progress().exerciseHistory) {
      latest.set(`${result.moduleId}:${result.exerciseId.replace(/^free-/, '')}`, result);
    }
    const counts = new Map<ModuleId, number>();
    for (const result of latest.values()) {
      if (!result.correct && this.progress.isModuleUnlocked(result.moduleId)) {
        counts.set(result.moduleId, (counts.get(result.moduleId) ?? 0) + 1);
      }
    }
    return [...counts].sort((first, second) => second[1] - first[1])[0]?.[0];
  }

  reviewLesson(moduleId: ModuleId): JourneyLesson | undefined {
    if (!this.progress.isModuleUnlocked(moduleId)) return undefined;
    const latest = new Map<string, boolean>();
    for (const result of this.progress.progress().exerciseHistory) {
      if (result.moduleId === moduleId) latest.set(result.exerciseId.replace(/^free-/, ''), result.correct);
    }
    const exercises = this.api.exercises().filter(exercise => latest.get(exercise.id) === false)
      .slice(0, 3).map(exercise => ({ ...exercise, moduleId }));
    return exercises.length ? { index: 0, exercises, completed: false, unlocked: true } : this.nextLesson(moduleId);
  }
}