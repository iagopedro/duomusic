"""Templates de prompt para geração de exercícios via LLM."""

_EXERCISE_SCHEMA = """
Tipos de exercício e seus campos obrigatórios (JSON com chaves em camelCase):

1. rhythm:
   id, moduleId, type:"rhythm", difficulty(1-3), xpReward, conceptKey, questionKey,
   bpm(int), pattern(array de "quarter"|"eighth"|"rest"), toleranceMs(int)

2. interval:
   id, moduleId, type:"interval", difficulty(1-3), xpReward, conceptKey, questionKey,
   rootFreq(float Hz), semitones(int), options(array de int — a resposta correta DEVE estar incluída)

3. chord:
   id, moduleId, type:"chord", difficulty(1-3), xpReward, conceptKey, questionKey,
   rootFreq(float Hz), chordType("major"|"minor"|"dim"|"aug"), options(array de chordType)

4. note-id:
   id, moduleId, type:"note-id", difficulty(1-3), xpReward, conceptKey, questionKey,
   noteFreq(float Hz), noteName(string ex:"C4"), showHint(boolean)

5. melody:
   id, moduleId, type:"melody", difficulty(1-3), xpReward, conceptKey, questionKey,
   bpm(int), notes(array de {{ note:string, freq:float, durationMs:int }})
"""

_NOTE_FREQUENCIES = """
Frequências de referência (Hz):
C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88, C5=523.25
C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196.00, A3=220.00, B3=246.94
"""

_MODULE_HINTS: dict[str, str] = {
    "fundamentals": "Priorize exercícios de rhythm, note-id e melody simples. Dificuldade entre 1 e 2.",
    "intervals": "Priorize exercícios de interval. Semitons de 1 a 12. Dificuldade entre 1 e 2.",
    "scales": "Use exercícios de interval com semitons maiores (5-12). Dificuldade 2 a 3.",
    "chords": "Priorize exercícios de chord. Varie entre major, minor, dim e aug. Dificuldade 1 a 3.",
    "mixed": "Misture todos os tipos de exercício. Dificuldade variada de 1 a 3.",
}


def build_exercise_prompt(module_id: str, count: int) -> str:
    """Constrói o prompt para geração de exercícios via LLM."""
    hint = _MODULE_HINTS.get(module_id, _MODULE_HINTS["mixed"])

    return f"""Você é um professor de teoria musical especializado em ear training.
Gere exatamente {count} exercícios para o módulo "{module_id}" do aplicativo DuoMusic.

REGRAS:
- Retorne SOMENTE um array JSON válido, sem markdown, sem texto adicional.
- Cada exercício deve ter um ID único com prefixo do tipo (r-, i-, c-, n-, m-) seguido de "gen-" e número.
- Use as chaves i18n existentes para conceptKey e questionKey.
- A resposta correta DEVE estar incluída nas options.
- Use as frequências de referência fornecidas abaixo.

DICA PARA O MÓDULO "{module_id}":
{hint}

{_EXERCISE_SCHEMA}

{_NOTE_FREQUENCIES}

Chaves i18n válidas:
- conceptKey: exercise.rhythm.title, exercise.interval.title, exercise.chord.title, exercise.note.title, exercise.melody.title
- questionKey: exercise.rhythm.desc, exercise.interval.question, exercise.chord.question, exercise.note.question, exercise.melody.question

Gere {count} exercícios agora:"""
