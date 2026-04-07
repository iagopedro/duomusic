// ──────────────────────────────────────────────
// Modelos de domínio do DuoMusic MVP
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
  requiredModuleId?: ModuleId; // módulo anterior que deve ser concluído para desbloquear
  minXpToUnlock: number;
  exerciseIds: string[];
}

// ── Exercise ──────────────────────────────────
export interface BaseExercise {
  id: string;
  moduleId: ModuleId;
  type: ExerciseType;
  difficulty: 1 | 2 | 3;          // 1 = fácil, 2 = médio, 3 = difícil
  xpReward: number;
  conceptKey: string;              // chave i18n para a introdução do conceito
  questionKey: string;             // chave i18n para o rótulo da pergunta
  explanationKey?: string;         // chave i18n para a explicação pós-resposta
}

export interface RhythmExercise extends BaseExercise {
  type: 'rhythm';
  bpm: number;
  pattern: ('quarter' | 'eighth' | 'rest')[]; // padrão rítmico
  toleranceMs: number;
}

export interface IntervalExercise extends BaseExercise {
  type: 'interval';
  rootFreq: number;
  semitones: number;
  options: number[];               // opções de semitons a apresentar
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
  attemptedAt: number;             // timestamp em ms (epoch)
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
  lastPracticeDate: string | null;  // data no formato ISO YYYY-MM-DD
  unlockedModuleIds: ModuleId[];
  completedModuleIds: ModuleId[];
  earnedAchievementIds: string[];
  exerciseHistory: ExerciseResult[];
  dailyMissions: DailyMission[];
  dailyMissionsDate: string | null; // data no formato ISO YYYY-MM-DD
  totalPracticeMs: number;
}

// ── Settings ──────────────────────────────────
export interface AppSettings {
  volume: number;                  // valor entre 0 e 1
  reduceAnimations: boolean;
  darkTheme: boolean;
}
