"""Testes para os modelos Pydantic do domínio."""

import pytest
from pydantic import ValidationError

from app.models.achievement import Achievement, AchievementCondition
from app.models.base import CamelModel
from app.models.exercise import (
    ChordExercise,
    IntervalExercise,
    MelodyExercise,
    MelodyNote,
    NoteExercise,
    RhythmExercise,
)
from app.models.module import Module


class TestCamelModel:
    """Testes para o modelo base com serialização camelCase."""

    def test_serializa_para_camel_case(self):
        class Exemplo(CamelModel):
            meu_campo: str
            outro_campo: int

        obj = Exemplo(meu_campo="valor", outro_campo=42)
        dados = obj.model_dump()
        assert "meuCampo" in dados
        assert "outroCampo" in dados
        assert "meu_campo" not in dados

    def test_model_dump_usa_alias_por_padrao(self):
        class Exemplo(CamelModel):
            nome_chave: str

        obj = Exemplo(nome_chave="teste")
        dados = obj.model_dump()
        assert dados["nomeChave"] == "teste"

    def test_aceita_populacao_por_nome_snake_case(self):
        class Exemplo(CamelModel):
            meu_campo: str

        obj = Exemplo(meu_campo="ok")
        assert obj.meu_campo == "ok"


class TestModule:
    """Testes para o modelo Module."""

    def test_criacao_modulo_completo(self):
        mod = Module(
            id="fundamentals",
            name_key="module.fundamentals",
            description="Desc",
            icon="piano",
            color="#22c55e",
            order=0,
            min_xp_to_unlock=0,
            exercise_ids=["n-1", "r-1"],
        )
        assert mod.id == "fundamentals"
        assert mod.required_module_id is None
        assert len(mod.exercise_ids) == 2

    def test_modulo_com_prerequisito(self):
        mod = Module(
            id="intervals",
            name_key="module.intervals",
            description="Desc",
            icon="linear_scale",
            color="#3b82f6",
            order=1,
            required_module_id="fundamentals",
            min_xp_to_unlock=50,
            exercise_ids=["i-1"],
        )
        assert mod.required_module_id == "fundamentals"

    def test_serializa_exercise_ids_como_camel(self):
        mod = Module(
            id="test", name_key="k", description="d", icon="i",
            color="#fff", order=0, min_xp_to_unlock=0, exercise_ids=["x-1"],
        )
        dados = mod.model_dump()
        assert "exerciseIds" in dados
        assert "exercise_ids" not in dados


class TestAchievement:
    """Testes para os modelos Achievement e AchievementCondition."""

    def test_criacao_conquista_xp(self):
        condicao = AchievementCondition(type="xp", value=100)
        conquista = Achievement(
            id="xp-100", icon="⭐",
            title_key="100 XP",
            description_key="Acumule 100 XP.",
            condition=condicao,
        )
        assert conquista.id == "xp-100"
        assert conquista.condition.type == "xp"
        assert conquista.condition.module_id is None

    def test_condicao_module_complete_com_module_id(self):
        condicao = AchievementCondition(
            type="module_complete", value=1, module_id="fundamentals"
        )
        assert condicao.module_id == "fundamentals"

    def test_tipo_invalido_levanta_validationerror(self):
        with pytest.raises(ValidationError):
            AchievementCondition(type="invalid_type", value=1)

    def test_serializa_condition_como_camel_case(self):
        condicao = AchievementCondition(type="module_complete", value=1, module_id="x")
        dados = condicao.model_dump()
        assert "moduleId" in dados
        assert "module_id" not in dados


class TestRhythmExercise:
    """Testes para exercícios de ritmo."""

    def test_criacao_valida(self):
        ex = RhythmExercise(
            id="r-test", module_id="fundamentals", difficulty=1, xp_reward=10,
            concept_key="c", question_key="q",
            bpm=80, pattern=["quarter", "eighth", "rest"], tolerance_ms=300,
        )
        assert ex.type == "rhythm"
        assert ex.pattern == ["quarter", "eighth", "rest"]

    def test_dificuldade_invalida_levanta_validationerror(self):
        with pytest.raises(ValidationError):
            RhythmExercise(
                id="r-x", module_id="m", difficulty=4, xp_reward=10,
                concept_key="c", question_key="q",
                bpm=80, pattern=["quarter"], tolerance_ms=300,
            )

    def test_valor_pattern_invalido_levanta_validationerror(self):
        with pytest.raises(ValidationError):
            RhythmExercise(
                id="r-x", module_id="m", difficulty=1, xp_reward=10,
                concept_key="c", question_key="q",
                bpm=80, pattern=["whole"],  # valor inválido
                tolerance_ms=300,
            )

    def test_serializa_com_camel_case(self):
        ex = RhythmExercise(
            id="r-1", module_id="fundamentals", difficulty=1, xp_reward=10,
            concept_key="c", question_key="q",
            bpm=80, pattern=["quarter"], tolerance_ms=300,
        )
        dados = ex.model_dump()
        assert "moduleId" in dados
        assert "xpReward" in dados
        assert "toleranceMs" in dados


class TestIntervalExercise:
    """Testes para exercícios de intervalo."""

    def test_criacao_valida(self):
        ex = IntervalExercise(
            id="i-test", module_id="intervals", difficulty=2, xp_reward=15,
            concept_key="c", question_key="q",
            root_freq=261.63, semitones=4, options=[3, 4, 5],
        )
        assert ex.type == "interval"
        assert ex.semitones == 4

    def test_serializa_root_freq_como_camel(self):
        ex = IntervalExercise(
            id="i-1", module_id="intervals", difficulty=1, xp_reward=15,
            concept_key="c", question_key="q",
            root_freq=261.63, semitones=4, options=[3, 4, 5],
        )
        dados = ex.model_dump()
        assert "rootFreq" in dados
        assert "root_freq" not in dados


class TestChordExercise:
    """Testes para exercícios de acorde."""

    def test_criacao_valida_major(self):
        ex = ChordExercise(
            id="c-test", module_id="chords", difficulty=1, xp_reward=20,
            concept_key="c", question_key="q",
            root_freq=261.63, chord_type="major", options=["major", "minor"],
        )
        assert ex.type == "chord"
        assert ex.chord_type == "major"

    def test_chord_type_invalido_levanta_validationerror(self):
        with pytest.raises(ValidationError):
            ChordExercise(
                id="c-x", module_id="chords", difficulty=1, xp_reward=20,
                concept_key="c", question_key="q",
                root_freq=261.63, chord_type="suspended",  # inválido
                options=["major"],
            )

    def test_todos_chord_types_validos(self):
        for chord_type in ["major", "minor", "dim", "aug"]:
            ex = ChordExercise(
                id="c-x", module_id="chords", difficulty=1, xp_reward=20,
                concept_key="c", question_key="q",
                root_freq=261.63, chord_type=chord_type,
                options=[chord_type],
            )
            assert ex.chord_type == chord_type


class TestNoteExercise:
    """Testes para exercícios de identificação de nota."""

    def test_criacao_valida(self):
        ex = NoteExercise(
            id="n-test", module_id="fundamentals", difficulty=1, xp_reward=10,
            concept_key="c", question_key="q",
            note_freq=261.63, note_name="C4", show_hint=True,
        )
        assert ex.type == "note-id"
        assert ex.note_name == "C4"
        assert ex.show_hint is True

    def test_serializa_show_hint_como_camel(self):
        ex = NoteExercise(
            id="n-1", module_id="fundamentals", difficulty=1, xp_reward=10,
            concept_key="c", question_key="q",
            note_freq=261.63, note_name="C4", show_hint=False,
        )
        dados = ex.model_dump()
        assert "showHint" in dados
        assert "noteFreq" in dados


class TestMelodyExercise:
    """Testes para exercícios de melodia."""

    def test_criacao_valida(self):
        notas = [
            MelodyNote(note="C4", freq=261.63, duration_ms=500),
            MelodyNote(note="E4", freq=329.63, duration_ms=500),
        ]
        ex = MelodyExercise(
            id="m-test", module_id="fundamentals", difficulty=1, xp_reward=10,
            concept_key="c", question_key="q",
            notes=notas, bpm=120,
        )
        assert ex.type == "melody"
        assert len(ex.notes) == 2

    def test_melody_note_serializa_duration_ms(self):
        nota = MelodyNote(note="A4", freq=440.0, duration_ms=1000)
        dados = nota.model_dump()
        assert "durationMs" in dados
        assert "duration_ms" not in dados

    def test_melody_exercise_sem_notas_valido(self):
        ex = MelodyExercise(
            id="m-x", module_id="fundamentals", difficulty=1, xp_reward=10,
            concept_key="c", question_key="q",
            notes=[], bpm=100,
        )
        assert ex.notes == []


class TestExerciseDiscriminator:
    """Testa a union discriminada Exercise."""

    def test_discrimina_rhythm_por_type(self):
        from pydantic import TypeAdapter
        from app.models.exercise import Exercise

        adapter = TypeAdapter(Exercise)
        ex = adapter.validate_python({
            "id": "r-1", "moduleId": "fundamentals", "type": "rhythm",
            "difficulty": 1, "xpReward": 10, "conceptKey": "c", "questionKey": "q",
            "bpm": 80, "pattern": ["quarter"], "toleranceMs": 300,
        })
        assert isinstance(ex, RhythmExercise)

    def test_discrimina_note_id_por_type(self):
        from pydantic import TypeAdapter
        from app.models.exercise import Exercise

        adapter = TypeAdapter(Exercise)
        ex = adapter.validate_python({
            "id": "n-1", "moduleId": "fundamentals", "type": "note-id",
            "difficulty": 1, "xpReward": 10, "conceptKey": "c", "questionKey": "q",
            "noteFreq": 261.63, "noteName": "C4", "showHint": True,
        })
        assert isinstance(ex, NoteExercise)

    def test_type_desconhecido_levanta_validationerror(self):
        from pydantic import TypeAdapter
        from app.models.exercise import Exercise

        adapter = TypeAdapter(Exercise)
        with pytest.raises(ValidationError):
            adapter.validate_python({
                "id": "x-1", "moduleId": "m", "type": "unknown",
                "difficulty": 1, "xpReward": 10, "conceptKey": "c", "questionKey": "q",
            })
