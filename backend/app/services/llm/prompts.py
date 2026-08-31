"""Templates de prompt para geração de exercícios via LLM."""

import random
from datetime import datetime

from ...utils.security import validate_module_id

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
C#4=277.18, D#4=311.13, F#4=369.99, G#4=415.30, A#4=466.16
"""

_MODULE_HINTS: dict[str, str] = {
    "fundamentals": "Priorize exercícios de rhythm, note-id e melody simples. Dificuldade entre 1 e 2.",
    "intervals": "Priorize exercícios de interval. Semitons de 1 a 12. Dificuldade entre 1 e 2.",
    "scales": "Use exercícios de interval com semitons maiores (5-12). Dificuldade 2 a 3.",
    "chords": "Priorize exercícios de chord. Varie entre major, minor, dim e aug. Dificuldade 1 a 3.",
    "mixed": "Misture todos os tipos de exercício. Dificuldade variada de 1 a 3.",
}


def build_exercise_prompt(module_id: str, count: int) -> str:
    """
    Constrói o prompt para geração de exercícios via LLM.

    Args:
        module_id: ID do módulo (será validado contra whitelist).
        count: Número de exercícios a gerar.

    Returns:
        Prompt formatado para o LLM.

    Raises:
        PromptInjectionError: Se module_id não for válido.
    """
    # Valida contra prompt injection antes de interpolar no prompt
    safe_module_id = validate_module_id(module_id)
    hint = _MODULE_HINTS.get(safe_module_id, _MODULE_HINTS["mixed"])
    
    # Seed aleatório para garantir exercícios únicos a cada chamada
    seed = random.randint(1000, 9999)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Variações aleatórias para o prompt
    root_notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C3", "D3", "E3"]
    suggested_root = random.choice(root_notes)
    bpm_range = random.choice(["60-80 (lento)", "80-100 (médio)", "100-120 (rápido)"])

    return f"""Você é um professor de teoria musical especializado em ear training.
Gere exatamente {count} exercícios ÚNICOS e ALEATÓRIOS para o módulo "{safe_module_id}" do aplicativo DuoMusic.

⚠️ ALEATORIEDADE OBRIGATÓRIA (seed={seed}, timestamp={timestamp}):
- NUNCA repita exercícios anteriores — cada chamada deve gerar conteúdo completamente novo
- Varie as notas raiz (sugestão: comece em {suggested_root})
- Varie os BPMs no range {bpm_range}
- Misture dificuldades (1, 2 e 3) de forma equilibrada
- Use padrões rítmicos diferentes a cada vez
- Varie os intervalos e tipos de acorde

REGRAS:
- Retorne SOMENTE um array JSON válido, sem markdown, sem texto adicional.
- Cada exercício deve ter um ID único: prefixo do tipo (r-, i-, c-, n-, m-) + "gen-{seed}-" + número.
- Use as chaves i18n existentes para conceptKey e questionKey.
- A resposta correta DEVE estar incluída nas options.
- Use as frequências de referência fornecidas abaixo.
- xpReward deve ser: dificuldade 1 = 10-15 XP, dificuldade 2 = 20-25 XP, dificuldade 3 = 30-40 XP.

DICA PARA O MÓDULO "{module_id}":
{hint}

{_EXERCISE_SCHEMA}

{_NOTE_FREQUENCIES}

Chaves i18n válidas:
- conceptKey: exercise.rhythm.title, exercise.interval.title, exercise.chord.title, exercise.note.title, exercise.melody.title
- questionKey: exercise.rhythm.desc, exercise.interval.question, exercise.chord.question, exercise.note.question, exercise.melody.question

Gere {count} exercícios ÚNICOS agora (lembre-se: seed={seed})."""
