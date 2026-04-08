from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import Field

from .base import CamelModel

ChordType = Literal["major", "minor", "dim", "aug"]
ExerciseType = Literal["rhythm", "interval", "chord", "note-id", "melody"]
RhythmValue = Literal["quarter", "eighth", "rest"]


class BaseExercise(CamelModel):
    """Campos comuns a todos os tipos de exercício."""

    id: str
    module_id: str
    type: ExerciseType
    difficulty: Literal[1, 2, 3]
    xp_reward: int
    concept_key: str
    question_key: str
    explanation_key: str | None = None


class RhythmExercise(BaseExercise):
    type: Literal["rhythm"] = "rhythm"
    bpm: int
    pattern: list[RhythmValue]
    tolerance_ms: int


class IntervalExercise(BaseExercise):
    type: Literal["interval"] = "interval"
    root_freq: float
    semitones: int
    options: list[int]


class ChordExercise(BaseExercise):
    type: Literal["chord"] = "chord"
    root_freq: float
    chord_type: ChordType
    options: list[ChordType]


class NoteExercise(BaseExercise):
    type: Literal["note-id"] = "note-id"
    note_freq: float
    note_name: str
    show_hint: bool


class MelodyNote(CamelModel):
    note: str
    freq: float
    duration_ms: int


class MelodyExercise(BaseExercise):
    type: Literal["melody"] = "melody"
    notes: list[MelodyNote]
    bpm: int


Exercise = Annotated[
    Union[RhythmExercise, IntervalExercise, ChordExercise, NoteExercise, MelodyExercise],
    Field(discriminator="type"),
]
