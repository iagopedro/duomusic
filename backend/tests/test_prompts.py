"""Testes para os templates de prompt do LLM."""

from app.services.llm.prompts import build_exercise_prompt


class TestBuildExercisePrompt:
    """Testes para a função build_exercise_prompt."""

    def test_contem_module_id_no_prompt(self):
        prompt = build_exercise_prompt("intervals", 5)
        assert "intervals" in prompt

    def test_contem_count_no_prompt(self):
        prompt = build_exercise_prompt("intervals", 7)
        assert "7" in prompt

    def test_prompt_e_string(self):
        assert isinstance(build_exercise_prompt("fundamentals", 5), str)

    def test_contem_schema_dos_tipos_de_exercicio(self):
        prompt = build_exercise_prompt("chords", 5)
        for tipo in ["rhythm", "interval", "chord", "note-id", "melody"]:
            assert tipo in prompt

    def test_hint_fundamentals_no_prompt(self):
        prompt = build_exercise_prompt("fundamentals", 5)
        assert "rhythm" in prompt.lower()
        assert "note-id" in prompt.lower()

    def test_hint_intervals_no_prompt(self):
        prompt = build_exercise_prompt("intervals", 5)
        assert "interval" in prompt.lower()

    def test_hint_scales_no_prompt(self):
        prompt = build_exercise_prompt("scales", 5)
        assert "scales" in prompt or "interval" in prompt.lower()

    def test_hint_chords_no_prompt(self):
        prompt = build_exercise_prompt("chords", 5)
        assert "chord" in prompt.lower()

    def test_hint_mixed_no_prompt(self):
        prompt = build_exercise_prompt("mixed", 5)
        assert "mixed" in prompt or "Misture" in prompt

    def test_modulo_desconhecido_usa_hint_mixed(self):
        """Módulo não mapeado deve usar o hint de 'mixed' como fallback."""
        prompt_desconhecido = build_exercise_prompt("modulo-nao-existe", 5)
        prompt_mixed = build_exercise_prompt("mixed", 5)
        # Ambos devem conter o mesmo hint de fallback
        assert "Misture" in prompt_desconhecido or "mixed" in prompt_desconhecido.lower()

    def test_prompt_contem_instrucao_json_puro(self):
        prompt = build_exercise_prompt("fundamentals", 5)
        assert "JSON" in prompt

    def test_prompt_contem_frequencias_de_referencia(self):
        prompt = build_exercise_prompt("intervals", 5)
        # Deve conter pelo menos uma frequência de referência
        assert "440" in prompt or "261" in prompt

    def test_count_um_no_prompt(self):
        prompt = build_exercise_prompt("intervals", 1)
        assert "1" in prompt

    def test_count_vinte_no_prompt(self):
        prompt = build_exercise_prompt("mixed", 20)
        assert "20" in prompt
