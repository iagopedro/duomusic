"""Testes para o módulo de segurança (proteção contra prompt injection)."""

import pytest

from app.utils.security import (
    ALLOWED_MODULE_IDS,
    PromptInjectionError,
    sanitize_for_prompt,
    validate_module_id,
)


class TestValidateModuleId:
    """Testes para validate_module_id."""

    def test_aceita_modulo_valido_fundamentals(self):
        assert validate_module_id("fundamentals") == "fundamentals"

    def test_aceita_modulo_valido_intervals(self):
        assert validate_module_id("intervals") == "intervals"

    def test_aceita_modulo_valido_scales(self):
        assert validate_module_id("scales") == "scales"

    def test_aceita_modulo_valido_chords(self):
        assert validate_module_id("chords") == "chords"

    def test_aceita_modulo_valido_mixed(self):
        assert validate_module_id("mixed") == "mixed"

    def test_normaliza_para_lowercase(self):
        assert validate_module_id("FUNDAMENTALS") == "fundamentals"
        assert validate_module_id("Intervals") == "intervals"
        assert validate_module_id("CHORDS") == "chords"

    def test_remove_espacos_em_branco(self):
        assert validate_module_id("  fundamentals  ") == "fundamentals"
        assert validate_module_id("\tintervals\n") == "intervals"

    def test_rejeita_modulo_inexistente(self):
        with pytest.raises(PromptInjectionError, match="não é um módulo válido"):
            validate_module_id("inexistente")

    def test_rejeita_string_vazia(self):
        with pytest.raises(PromptInjectionError, match="não pode ser vazio"):
            validate_module_id("")

    def test_rejeita_prompt_injection_com_aspas(self):
        with pytest.raises(PromptInjectionError, match="caracteres inválidos"):
            validate_module_id('fundamentals" ignore previous')

    def test_rejeita_prompt_injection_com_newline(self):
        with pytest.raises(PromptInjectionError, match="caracteres inválidos"):
            validate_module_id("fundamentals\nignore all")

    def test_rejeita_prompt_injection_com_carriage_return(self):
        with pytest.raises(PromptInjectionError, match="caracteres inválidos"):
            validate_module_id("fundamentals\r\nignore all")

    def test_rejeita_caracteres_especiais(self):
        payloads = [
            "fundamentals; DROP TABLE",
            "fundamentals<script>",
            "fundamentals${env}",
            "fundamentals$(whoami)",
            "fundamentals`id`",
        ]
        for payload in payloads:
            with pytest.raises(PromptInjectionError):
                validate_module_id(payload)

    def test_rejeita_unicode_injection(self):
        with pytest.raises(PromptInjectionError, match="caracteres inválidos"):
            validate_module_id("fundаmentals")  # 'а' cirílico

    def test_rejeita_string_muito_longa(self):
        with pytest.raises(PromptInjectionError, match="caracteres inválidos"):
            validate_module_id("a" * 100)


class TestSanitizeForPrompt:
    """Testes para sanitize_for_prompt."""

    def test_retorna_string_limpa(self):
        assert sanitize_for_prompt("hello world") == "hello world"

    def test_remove_newlines(self):
        assert sanitize_for_prompt("hello\nworld") == "helloworld"
        assert sanitize_for_prompt("hello\r\nworld") == "helloworld"

    def test_remove_aspas_duplas(self):
        assert sanitize_for_prompt('hello "world"') == "hello world"

    def test_remove_aspas_simples(self):
        assert sanitize_for_prompt("hello 'world'") == "hello world"

    def test_remove_backslashes(self):
        assert sanitize_for_prompt("hello\\nworld") == "hellonworld"

    def test_remove_caracteres_de_controle(self):
        assert sanitize_for_prompt("hello\x00world") == "helloworld"
        assert sanitize_for_prompt("hello\x1fworld") == "helloworld"

    def test_trunca_para_max_length(self):
        result = sanitize_for_prompt("a" * 200, max_length=50)
        assert len(result) == 50

    def test_retorna_vazio_para_none_like(self):
        assert sanitize_for_prompt("") == ""

    def test_strip_espacos(self):
        assert sanitize_for_prompt("  hello  ") == "hello"


class TestAllowedModuleIds:
    """Testes para a constante ALLOWED_MODULE_IDS."""

    def test_contem_todos_modulos_esperados(self):
        expected = {"fundamentals", "intervals", "scales", "chords", "mixed"}
        assert ALLOWED_MODULE_IDS == expected

    def test_e_frozenset_imutavel(self):
        assert isinstance(ALLOWED_MODULE_IDS, frozenset)


class TestPromptInjectionError:
    """Testes para PromptInjectionError."""

    def test_e_subclasse_de_value_error(self):
        assert issubclass(PromptInjectionError, ValueError)

    def test_pode_ser_lancada_com_mensagem(self):
        with pytest.raises(PromptInjectionError, match="mensagem teste"):
            raise PromptInjectionError("mensagem teste")
