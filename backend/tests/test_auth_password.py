"""Testes para funções de hash e verificação de senhas."""

import pytest

from app.auth.password import hash_password, verify_password


class TestHashPassword:
    """Testes para a função hash_password."""

    def test_retorna_string_diferente_do_input(self):
        """1.1 - Hash é diferente da senha original."""
        senha = "minha_senha_123"
        hashed = hash_password(senha)
        assert hashed != senha

    def test_gera_hashes_diferentes_para_mesma_senha(self):
        """1.2 - Salt garante hashes únicos."""
        senha = "minha_senha_123"
        hash1 = hash_password(senha)
        hash2 = hash_password(senha)
        assert hash1 != hash2

    def test_funciona_com_caracteres_especiais(self):
        """1.5 - Aceita caracteres especiais."""
        senha = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        hashed = hash_password(senha)
        assert verify_password(senha, hashed)

    def test_funciona_com_unicode(self):
        """1.6 - Aceita caracteres unicode (emojis, acentos)."""
        senha = "Música🎵Café☕日本語"
        hashed = hash_password(senha)
        assert verify_password(senha, hashed)

    def test_funciona_com_senha_longa(self):
        """1.7 - Aceita senha longa (truncada para 72 bytes internamente)."""
        # bcrypt tem limite de 72 bytes, mas a função trunca internamente
        senha = "a" * 128
        hashed = hash_password(senha)
        # Verifica que funciona (truncamento é transparente)
        assert verify_password(senha, hashed)


class TestVerifyPassword:
    """Testes para a função verify_password."""

    def test_retorna_true_para_senha_correta(self):
        """1.3 - Verifica senha corretamente."""
        senha = "senha_secreta_123"
        hashed = hash_password(senha)
        assert verify_password(senha, hashed) is True

    def test_retorna_false_para_senha_incorreta(self):
        """1.4 - Rejeita senha incorreta."""
        senha_original = "senha_secreta_123"
        senha_errada = "senha_errada_456"
        hashed = hash_password(senha_original)
        assert verify_password(senha_errada, hashed) is False

    def test_retorna_false_para_senha_parcial(self):
        """Senha parcialmente correta deve falhar."""
        senha = "senha_completa"
        hashed = hash_password(senha)
        assert verify_password("senha_", hashed) is False

    def test_case_sensitive(self):
        """Verificação é case-sensitive."""
        senha = "SenhaMaiuscula"
        hashed = hash_password(senha)
        assert verify_password("senhamaiuscula", hashed) is False
