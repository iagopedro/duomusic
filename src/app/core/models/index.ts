// ──────────────────────────────────────────────
// Domain models for DuoMusic MVP
// ──────────────────────────────────────────────

export type ChordType = 'major' | 'minor' | 'dim' | 'aug';
export type OscillatorType = 'sine' | 'square' | 'triangle' | 'sawtooth';
export type ExerciseType = 'rhythm' | 'interval' | 'chord' | 'note-id' | 'melody';
export type ModuleId = 'fundamentals' | 'intervals' | 'scales' | 'chords' | 'mixed';

// ── Module ────────────────────────────────────
export interface Module {
  id: ModuleId;
  nameKey: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  requiredModuleId?: ModuleId; // previous module that must be completed to unlock
  minXpToUnlock: number;
  exerciseIds: string[];
}

// ── Exercise ──────────────────────────────────
export interface BaseExercise {
  id: string;
  moduleId: ModuleId;
  type: ExerciseType;
  difficulty: 1 | 2 | 3;          // 1 = easy, 2 = medium, 3 = hard
  xpReward: number;
  conceptKey: string;              // i18n key for the concept intro
  questionKey: string;             // i18n key for the question label
  explanationKey?: string;         // i18n key for the post-answer explanation
}

export interface RhythmExercise extends BaseExercise {
  type: 'rhythm';
  bpm: number;
  pattern: ('quarter' | 'eighth' | 'rest')[]; // beat pattern
  toleranceMs: number;
}

export interface IntervalExercise extends BaseExercise {
  type: 'interval';
  rootFreq: number;
  semitones: number;
  options: number[];               // semitone options to present
}

export interface ChordExercise extends BaseExercise {
  type: 'chord';
  rootFreq: number;
  chordType: ChordType;
  options: ChordType[];
}

export interface NoteExercise extends BaseExercise {
  type: 'note-id';
  noteFreq: number;   // frequência da nota a tocar e identificar
  noteName: string;   // resposta correta, ex.: 'C4'
  showHint: boolean;  // pisca brevemente a tecla-alvo antes de esconder
}

export interface MelodyNote {
  note: string;       // ex: 'C4'
  freq: number;
  durationMs: number;
}

export interface MelodyExercise extends BaseExercise {
  type: 'melody';
  notes: MelodyNote[];
  bpm: number;
}

export type Exercise = RhythmExercise | IntervalExercise | ChordExercise | NoteExercise | MelodyExercise;

// ── Exercise Result ───────────────────────────
export interface ExerciseResult {
  exerciseId: string;
  moduleId: ModuleId;
  correct: boolean;
  xpEarned: number;
  attemptedAt: number;             // epoch ms
  durationMs: number;
}

// ── Achievement ───────────────────────────────
export interface Achievement {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  condition: AchievementCondition;
}

export interface AchievementCondition {
  type: 'xp' | 'streak' | 'module_complete' | 'exercises_done' | 'accuracy';
  value: number;
  moduleId?: ModuleId;
}

// ── Daily Mission ─────────────────────────────
export interface DailyMission {
  id: string;
  descriptionKey: string;
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
  type: 'exercises_done' | 'streak' | 'module_exercise';
  moduleId?: ModuleId;
}

// ── User Progress ─────────────────────────────
export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastPracticeDate: string | null;  // ISO date string YYYY-MM-DD
  unlockedModuleIds: ModuleId[];
  completedModuleIds: ModuleId[];
  earnedAchievementIds: string[];
  exerciseHistory: ExerciseResult[];
  dailyMissions: DailyMission[];
  dailyMissionsDate: string | null; // ISO date string YYYY-MM-DD
  totalPracticeMs: number;
}

// ── Settings ──────────────────────────────────
export interface AppSettings {
  volume: number;                  // 0–1
  reduceAnimations: boolean;
  darkTheme: boolean;
}
