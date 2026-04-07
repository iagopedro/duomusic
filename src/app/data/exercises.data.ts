import { Exercise, NoteExercise, MelodyExercise } from '../core/models';

// Base A4 = 440 Hz; semitone factor = 2^(1/12)
const A4 = 440;
const st = (n: number) => A4 * Math.pow(2, n / 12);
const C4 = st(-9);   // ~261.63 Hz
const D4 = st(-7);   // ~293.66 Hz
const E4 = st(-5);   // ~329.63 Hz
const F4 = st(-4);   // ~349.23 Hz
const G4 = st(-2);   // ~392.00 Hz
// const A4 used directly above
const B4 = st(2);    // ~493.88 Hz
const C5 = st(3);    // ~523.25 Hz

const q = 500;  // quarter note duration ms (120 bpm)
const h = 1000; // half note duration ms

export const EXERCISES: Exercise[] = [
  // ── Rhythm exercises ─────────────────────────────────────────────────────
  {
    id: 'r-1',
    moduleId: 'fundamentals',
    type: 'rhythm',
    difficulty: 1,
    xpReward: 10,
    conceptKey: 'exercise.rhythm.title',
    questionKey: 'exercise.rhythm.desc',
    bpm: 80,
    pattern: ['quarter', 'quarter', 'quarter', 'quarter'],
    toleranceMs: 300,
  },
  {
    id: 'r-2',
    moduleId: 'fundamentals',
    type: 'rhythm',
    difficulty: 1,
    xpReward: 10,
    conceptKey: 'exercise.rhythm.title',
    questionKey: 'exercise.rhythm.desc',
    bpm: 90,
    pattern: ['quarter', 'eighth', 'eighth', 'quarter'],
    toleranceMs: 250,
  },
  {
    id: 'r-3',
    moduleId: 'fundamentals',
    type: 'rhythm',
    difficulty: 2,
    xpReward: 15,
    conceptKey: 'exercise.rhythm.title',
    questionKey: 'exercise.rhythm.desc',
    bpm: 100,
    pattern: ['eighth', 'eighth', 'quarter', 'eighth', 'eighth'],
    toleranceMs: 220,
  },

  // ── Interval exercises ────────────────────────────────────────────────────
  {
    id: 'i-1',
    moduleId: 'intervals',
    type: 'interval',
    difficulty: 1,
    xpReward: 15,
    conceptKey: 'exercise.interval.title',
    questionKey: 'exercise.interval.question',
    explanationKey: 'exercise.interval.desc',
    rootFreq: C4,
    semitones: 4,   // major 3rd
    options: [3, 4, 5, 7],
  },
  {
    id: 'i-2',
    moduleId: 'intervals',
    type: 'interval',
    difficulty: 1,
    xpReward: 15,
    conceptKey: 'exercise.interval.title',
    questionKey: 'exercise.interval.question',
    explanationKey: 'exercise.interval.desc',
    rootFreq: G4,
    semitones: 7,   // perfect 5th
    options: [4, 5, 7, 9],
  },
  {
    id: 'i-3',
    moduleId: 'intervals',
    type: 'interval',
    difficulty: 2,
    xpReward: 20,
    conceptKey: 'exercise.interval.title',
    questionKey: 'exercise.interval.question',
    explanationKey: 'exercise.interval.desc',
    rootFreq: D4,
    semitones: 3,   // minor 3rd
    options: [2, 3, 4, 5],
  },
  {
    id: 'i-4',
    moduleId: 'intervals',
    type: 'interval',
    difficulty: 2,
    xpReward: 20,
    conceptKey: 'exercise.interval.title',
    questionKey: 'exercise.interval.question',
    explanationKey: 'exercise.interval.desc',
    rootFreq: E4,
    semitones: 12,  // octave
    options: [7, 9, 11, 12],
  },
  {
    id: 'i-5',
    moduleId: 'scales',
    type: 'interval',
    difficulty: 2,
    xpReward: 20,
    conceptKey: 'exercise.interval.title',
    questionKey: 'exercise.interval.question',
    rootFreq: C4,
    semitones: 9,   // major 6th
    options: [7, 9, 10, 12],
  },
  {
    id: 'i-6',
    moduleId: 'scales',
    type: 'interval',
    difficulty: 3,
    xpReward: 25,
    conceptKey: 'exercise.interval.title',
    questionKey: 'exercise.interval.question',
    rootFreq: A4,
    semitones: 6,   // tritone
    options: [5, 6, 7, 8],
  },

  // ── Chord exercises ───────────────────────────────────────────────────────
  {
    id: 'c-1',
    moduleId: 'chords',
    type: 'chord',
    difficulty: 1,
    xpReward: 20,
    conceptKey: 'exercise.chord.title',
    questionKey: 'exercise.chord.question',
    explanationKey: 'exercise.chord.desc',
    rootFreq: C4,
    chordType: 'major',
    options: ['major', 'minor'],
  },
  {
    id: 'c-2',
    moduleId: 'chords',
    type: 'chord',
    difficulty: 1,
    xpReward: 20,
    conceptKey: 'exercise.chord.title',
    questionKey: 'exercise.chord.question',
    explanationKey: 'exercise.chord.desc',
    rootFreq: A4,
    chordType: 'minor',
    options: ['major', 'minor'],
  },
  {
    id: 'c-3',
    moduleId: 'chords',
    type: 'chord',
    difficulty: 2,
    xpReward: 25,
    conceptKey: 'exercise.chord.title',
    questionKey: 'exercise.chord.question',
    rootFreq: D4,
    chordType: 'dim',
    options: ['major', 'minor', 'dim', 'aug'],
  },

  // ── Note-id exercises ─────────────────────────────────────────────────────
  {
    id: 'n-1',
    moduleId: 'fundamentals',
    type: 'note-id',
    difficulty: 1,
    xpReward: 10,
    conceptKey: 'exercise.note.title',
    questionKey: 'exercise.note.question',
    explanationKey: 'exercise.note.desc',
    noteFreq: st(-9),  // C4
    noteName: 'C4',
    showHint: true,
  } as NoteExercise,
  {
    id: 'n-2',
    moduleId: 'fundamentals',
    type: 'note-id',
    difficulty: 1,
    xpReward: 10,
    conceptKey: 'exercise.note.title',
    questionKey: 'exercise.note.question',
    explanationKey: 'exercise.note.desc',
    noteFreq: st(3),   // G4
    noteName: 'G4',
    showHint: true,
  } as NoteExercise,
  {
    id: 'n-3',
    moduleId: 'fundamentals',
    type: 'note-id',
    difficulty: 1,
    xpReward: 10,
    conceptKey: 'exercise.note.title',
    questionKey: 'exercise.note.question',
    explanationKey: 'exercise.note.desc',
    noteFreq: st(-5),  // E4
    noteName: 'E4',
    showHint: true,
  } as NoteExercise,
  {
    id: 'n-4',
    moduleId: 'fundamentals',
    type: 'note-id',
    difficulty: 2,
    xpReward: 15,
    conceptKey: 'exercise.note.title',
    questionKey: 'exercise.note.question',
    explanationKey: 'exercise.note.desc',
    noteFreq: st(0),   // A4
    noteName: 'A4',
    showHint: false,
  } as NoteExercise,
  {
    id: 'n-5',
    moduleId: 'fundamentals',
    type: 'note-id',
    difficulty: 2,
    xpReward: 15,
    conceptKey: 'exercise.note.title',
    questionKey: 'exercise.note.question',
    explanationKey: 'exercise.note.desc',
    noteFreq: F4,
    noteName: 'F4',
    showHint: false,
  } as NoteExercise,

  // ── Melody exercises ──────────────────────────────────────────────────────
  // Dó-Ré-Mi (escala de Dó ascendente — 3 notas)
  {
    id: 'm-1',
    moduleId: 'fundamentals',
    type: 'melody',
    difficulty: 1,
    xpReward: 20,
    bpm: 100,
    conceptKey: 'exercise.melody.title',
    questionKey: 'exercise.melody.question',
    notes: [
      { note: 'C4', freq: C4, durationMs: q },
      { note: 'D4', freq: D4, durationMs: q },
      { note: 'E4', freq: E4, durationMs: h },
    ],
  } as MelodyExercise,

  // Dó-Mi-Sol (tríade de Dó maior)
  {
    id: 'm-2',
    moduleId: 'fundamentals',
    type: 'melody',
    difficulty: 1,
    xpReward: 20,
    bpm: 100,
    conceptKey: 'exercise.melody.title',
    questionKey: 'exercise.melody.question',
    notes: [
      { note: 'C4', freq: C4, durationMs: q },
      { note: 'E4', freq: E4, durationMs: q },
      { note: 'G4', freq: G4, durationMs: h },
    ],
  } as MelodyExercise,

  // Sol-Mi-Dó (tríade descendente)
  {
    id: 'm-3',
    moduleId: 'fundamentals',
    type: 'melody',
    difficulty: 2,
    xpReward: 25,
    bpm: 100,
    conceptKey: 'exercise.melody.title',
    questionKey: 'exercise.melody.question',
    notes: [
      { note: 'G4', freq: G4, durationMs: q },
      { note: 'E4', freq: E4, durationMs: q },
      { note: 'C4', freq: C4, durationMs: h },
    ],
  } as MelodyExercise,

  // Dó-Ré-Mi-Fá-Sol (escala de Dó — 5 notas)
  {
    id: 'm-4',
    moduleId: 'fundamentals',
    type: 'melody',
    difficulty: 2,
    xpReward: 30,
    bpm: 110,
    conceptKey: 'exercise.melody.title',
    questionKey: 'exercise.melody.question',
    notes: [
      { note: 'C4', freq: C4, durationMs: q },
      { note: 'D4', freq: D4, durationMs: q },
      { note: 'E4', freq: E4, durationMs: q },
      { note: 'F4', freq: F4, durationMs: q },
      { note: 'G4', freq: G4, durationMs: h },
    ],
  } as MelodyExercise,

  // Mi-Ré-Dó (descida simples — 3 notas)
  {
    id: 'm-5',
    moduleId: 'fundamentals',
    type: 'melody',
    difficulty: 1,
    xpReward: 20,
    bpm: 95,
    conceptKey: 'exercise.melody.title',
    questionKey: 'exercise.melody.question',
    notes: [
      { note: 'E4', freq: E4, durationMs: q },
      { note: 'D4', freq: D4, durationMs: q },
      { note: 'C4', freq: C4, durationMs: h },
    ],
  } as MelodyExercise,

  // Sol-Lá-Si-Dó5 (final da escala)
  {
    id: 'm-6',
    moduleId: 'fundamentals',
    type: 'melody',
    difficulty: 3,
    xpReward: 35,
    bpm: 110,
    conceptKey: 'exercise.melody.title',
    questionKey: 'exercise.melody.question',
    notes: [
      { note: 'G4', freq: G4, durationMs: q },
      { note: 'A4', freq: A4, durationMs: q },
      { note: 'B4', freq: B4, durationMs: q },
      { note: 'C5', freq: C5, durationMs: h },
    ],
  } as MelodyExercise,
];
