import { Exercise } from '../core/models';

// Base A4 = 440 Hz; semitone factor = 2^(1/12)
const A4 = 440;
const C4 = A4 * Math.pow(2, -9 / 12);   // ~261.63 Hz
const G4 = A4 * Math.pow(2,  3 / 12);   // ~392 Hz
const E4 = A4 * Math.pow(2, -5 / 12);   // ~329.63 Hz
const D4 = A4 * Math.pow(2, -7 / 12);   // ~293.66 Hz

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
];
