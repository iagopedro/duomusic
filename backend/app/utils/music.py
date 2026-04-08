"""Utilitários para cálculo de frequências musicais."""

import math

A4_FREQ = 440.0

# Nome da nota → offset em semitons a partir de A
_NOTE_OFFSETS: dict[str, int] = {
    "C": -9, "C#": -8, "Db": -8,
    "D": -7, "D#": -6, "Eb": -6,
    "E": -5,
    "F": -4, "F#": -3, "Gb": -3,
    "G": -2, "G#": -1, "Ab": -1,
    "A": 0, "A#": 1, "Bb": 1,
    "B": 2,
}


def note_to_freq(note: str) -> float:
    """Converte nome de nota (ex: 'C4', 'F#5') para frequência em Hz."""
    if len(note) == 2:
        name, octave = note[0], int(note[1])
    elif len(note) == 3:
        name, octave = note[:2], int(note[2])
    else:
        raise ValueError(f"Nota inválida: {note}")

    if name not in _NOTE_OFFSETS:
        raise ValueError(f"Nome de nota desconhecido: {name}")

    semitones = _NOTE_OFFSETS[name] + (octave - 4) * 12
    return A4_FREQ * math.pow(2, semitones / 12)


def semitones_from_a4(n: int) -> float:
    """Calcula frequência a partir do offset em semitons de A4."""
    return A4_FREQ * math.pow(2, n / 12)
