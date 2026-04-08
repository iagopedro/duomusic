from ..models.exercise import (
    RhythmExercise,
    IntervalExercise,
    ChordExercise,
    NoteExercise,
    MelodyExercise,
    MelodyNote,
)
from ..utils.music import note_to_freq

# Frequências pré-calculadas
C4 = note_to_freq("C4")
D4 = note_to_freq("D4")
E4 = note_to_freq("E4")
F4 = note_to_freq("F4")
G4 = note_to_freq("G4")
A4 = note_to_freq("A4")
B4 = note_to_freq("B4")
C5 = note_to_freq("C5")

Q = 500   # semínima em ms (120 bpm)
H = 1000  # mínima em ms

EXERCISES = [
    # ── Exercícios de ritmo ──────────────────────────────────────────────────
    RhythmExercise(
        id="r-1", module_id="fundamentals", difficulty=1, xp_reward=10,
        concept_key="exercise.rhythm.title", question_key="exercise.rhythm.desc",
        bpm=80, pattern=["quarter", "quarter", "quarter", "quarter"], tolerance_ms=300,
    ),
    RhythmExercise(
        id="r-2", module_id="fundamentals", difficulty=1, xp_reward=10,
        concept_key="exercise.rhythm.title", question_key="exercise.rhythm.desc",
        bpm=90, pattern=["quarter", "eighth", "eighth", "quarter"], tolerance_ms=250,
    ),
    RhythmExercise(
        id="r-3", module_id="fundamentals", difficulty=2, xp_reward=15,
        concept_key="exercise.rhythm.title", question_key="exercise.rhythm.desc",
        bpm=100, pattern=["eighth", "eighth", "quarter", "eighth", "eighth"], tolerance_ms=220,
    ),

    # ── Exercícios de intervalo ──────────────────────────────────────────────
    IntervalExercise(
        id="i-1", module_id="intervals", difficulty=1, xp_reward=15,
        concept_key="exercise.interval.title", question_key="exercise.interval.question",
        explanation_key="exercise.interval.desc",
        root_freq=C4, semitones=4, options=[3, 4, 5, 7],
    ),
    IntervalExercise(
        id="i-2", module_id="intervals", difficulty=1, xp_reward=15,
        concept_key="exercise.interval.title", question_key="exercise.interval.question",
        explanation_key="exercise.interval.desc",
        root_freq=G4, semitones=7, options=[4, 5, 7, 9],
    ),
    IntervalExercise(
        id="i-3", module_id="intervals", difficulty=2, xp_reward=20,
        concept_key="exercise.interval.title", question_key="exercise.interval.question",
        explanation_key="exercise.interval.desc",
        root_freq=D4, semitones=3, options=[2, 3, 4, 5],
    ),
    IntervalExercise(
        id="i-4", module_id="intervals", difficulty=2, xp_reward=20,
        concept_key="exercise.interval.title", question_key="exercise.interval.question",
        explanation_key="exercise.interval.desc",
        root_freq=E4, semitones=12, options=[7, 9, 11, 12],
    ),
    IntervalExercise(
        id="i-5", module_id="scales", difficulty=2, xp_reward=20,
        concept_key="exercise.interval.title", question_key="exercise.interval.question",
        root_freq=C4, semitones=9, options=[7, 9, 10, 12],
    ),
    IntervalExercise(
        id="i-6", module_id="scales", difficulty=3, xp_reward=25,
        concept_key="exercise.interval.title", question_key="exercise.interval.question",
        root_freq=A4, semitones=6, options=[5, 6, 7, 8],
    ),

    # ── Exercícios de acorde ─────────────────────────────────────────────────
    ChordExercise(
        id="c-1", module_id="chords", difficulty=1, xp_reward=20,
        concept_key="exercise.chord.title", question_key="exercise.chord.question",
        explanation_key="exercise.chord.desc",
        root_freq=C4, chord_type="major", options=["major", "minor"],
    ),
    ChordExercise(
        id="c-2", module_id="chords", difficulty=1, xp_reward=20,
        concept_key="exercise.chord.title", question_key="exercise.chord.question",
        explanation_key="exercise.chord.desc",
        root_freq=A4, chord_type="minor", options=["major", "minor"],
    ),
    ChordExercise(
        id="c-3", module_id="chords", difficulty=2, xp_reward=25,
        concept_key="exercise.chord.title", question_key="exercise.chord.question",
        root_freq=D4, chord_type="dim", options=["major", "minor", "dim", "aug"],
    ),

    # ── Exercícios de identificação de nota ──────────────────────────────────
    NoteExercise(
        id="n-1", module_id="fundamentals", difficulty=1, xp_reward=10,
        concept_key="exercise.note.title", question_key="exercise.note.question",
        explanation_key="exercise.note.desc",
        note_freq=C4, note_name="C4", show_hint=True,
    ),
    NoteExercise(
        id="n-2", module_id="fundamentals", difficulty=1, xp_reward=10,
        concept_key="exercise.note.title", question_key="exercise.note.question",
        explanation_key="exercise.note.desc",
        note_freq=G4, note_name="G4", show_hint=True,
    ),
    NoteExercise(
        id="n-3", module_id="fundamentals", difficulty=1, xp_reward=10,
        concept_key="exercise.note.title", question_key="exercise.note.question",
        explanation_key="exercise.note.desc",
        note_freq=E4, note_name="E4", show_hint=True,
    ),
    NoteExercise(
        id="n-4", module_id="fundamentals", difficulty=2, xp_reward=15,
        concept_key="exercise.note.title", question_key="exercise.note.question",
        explanation_key="exercise.note.desc",
        note_freq=A4, note_name="A4", show_hint=False,
    ),
    NoteExercise(
        id="n-5", module_id="fundamentals", difficulty=2, xp_reward=15,
        concept_key="exercise.note.title", question_key="exercise.note.question",
        explanation_key="exercise.note.desc",
        note_freq=F4, note_name="F4", show_hint=False,
    ),

    # ── Exercícios de melodia ────────────────────────────────────────────────
    MelodyExercise(
        id="m-1", module_id="fundamentals", difficulty=1, xp_reward=20, bpm=100,
        concept_key="exercise.melody.title", question_key="exercise.melody.question",
        notes=[
            MelodyNote(note="C4", freq=C4, duration_ms=Q),
            MelodyNote(note="D4", freq=D4, duration_ms=Q),
            MelodyNote(note="E4", freq=E4, duration_ms=H),
        ],
    ),
    MelodyExercise(
        id="m-2", module_id="fundamentals", difficulty=1, xp_reward=20, bpm=100,
        concept_key="exercise.melody.title", question_key="exercise.melody.question",
        notes=[
            MelodyNote(note="C4", freq=C4, duration_ms=Q),
            MelodyNote(note="E4", freq=E4, duration_ms=Q),
            MelodyNote(note="G4", freq=G4, duration_ms=H),
        ],
    ),
    MelodyExercise(
        id="m-3", module_id="fundamentals", difficulty=2, xp_reward=25, bpm=100,
        concept_key="exercise.melody.title", question_key="exercise.melody.question",
        notes=[
            MelodyNote(note="G4", freq=G4, duration_ms=Q),
            MelodyNote(note="E4", freq=E4, duration_ms=Q),
            MelodyNote(note="C4", freq=C4, duration_ms=H),
        ],
    ),
    MelodyExercise(
        id="m-4", module_id="fundamentals", difficulty=2, xp_reward=30, bpm=110,
        concept_key="exercise.melody.title", question_key="exercise.melody.question",
        notes=[
            MelodyNote(note="C4", freq=C4, duration_ms=Q),
            MelodyNote(note="D4", freq=D4, duration_ms=Q),
            MelodyNote(note="E4", freq=E4, duration_ms=Q),
            MelodyNote(note="F4", freq=F4, duration_ms=Q),
            MelodyNote(note="G4", freq=G4, duration_ms=H),
        ],
    ),
    MelodyExercise(
        id="m-5", module_id="fundamentals", difficulty=1, xp_reward=20, bpm=95,
        concept_key="exercise.melody.title", question_key="exercise.melody.question",
        notes=[
            MelodyNote(note="E4", freq=E4, duration_ms=Q),
            MelodyNote(note="D4", freq=D4, duration_ms=Q),
            MelodyNote(note="C4", freq=C4, duration_ms=H),
        ],
    ),
    MelodyExercise(
        id="m-6", module_id="fundamentals", difficulty=3, xp_reward=35, bpm=110,
        concept_key="exercise.melody.title", question_key="exercise.melody.question",
        notes=[
            MelodyNote(note="G4", freq=G4, duration_ms=Q),
            MelodyNote(note="A4", freq=A4, duration_ms=Q),
            MelodyNote(note="B4", freq=B4, duration_ms=Q),
            MelodyNote(note="C5", freq=C5, duration_ms=H),
        ],
    ),
]
