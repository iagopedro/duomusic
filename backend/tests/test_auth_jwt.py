"""Testes para funções de criação e validação de tokens JWT."""

from datetime import timedelta
from unittest.mock import patch

import pytest
from jose import jwt

from app.auth.jwt import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_expiry,
)
from app.config import get_settings


class TestCreateAccessToken:
    """Testes para a função create_access_token."""

    def test_retorna_string_jwt_valida(self):
        """2.1 - Token tem formato JWT válido (3 partes separadas por .)."""
        token = create_access_token("user-123")
        parts = token.split(".")
        assert len(parts) == 3

    def test_inclui_user_id_no_sub(self):
        """2.2 - Token contém user_id no campo 'sub'."""
        user_id = "user-abc-123"
        token = create_access_token(user_id)

        settings = get_settings()
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )

        assert payload["sub"] == user_id

    def test_inclui_campo_exp(self):
        """2.3 - Token contém campo de expiração."""
        token = create_access_token("user-123")

        settings = get_settings()
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )

        assert "exp" in payload

    def test_inclui_campo_iat(self):
        """2.4 - Token contém campo issued-at."""
        token = create_access_token("user-123")

        settings = get_settings()
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )

        assert "iat" in payload

    def test_tipo_e_access(self):
        """Token tem type='access'."""
        token = create_access_token("user-123")

        settings = get_settings()
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )

        assert payload["type"] == "access"


class TestCreateRefreshToken:
    """Testes para a função create_refresh_token."""

    def test_expiracao_maior_que_access_token(self):
        """2.5 - Refresh token tem expiração maior que access token."""
        access_token = create_access_token("user-123")
        refresh_token = create_refresh_token("user-123")

        access_exp = get_token_expiry(access_token)
        refresh_exp = get_token_expiry(refresh_token)

        assert refresh_exp is not None
        assert access_exp is not None
        assert refresh_exp > access_exp

    def test_tipo_e_refresh(self):
        """Token tem type='refresh'."""
        token = create_refresh_token("user-123")

        settings = get_settings()
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )

        assert payload["type"] == "refresh"


class TestDecodeToken:
    """Testes para a função decode_token."""

    def test_retorna_payload_para_token_valido(self):
        """2.6 - Decodifica token válido."""
        user_id = "user-decode-test"
        token = create_access_token(user_id)

        payload = decode_token(token)

        assert payload["sub"] == user_id
        assert "exp" in payload
        assert "iat" in payload

    def test_levanta_erro_para_token_expirado(self):
        """2.7 - Erro para token expirado."""
        token = create_access_token("user-123", expires_delta=timedelta(seconds=-1))

        with pytest.raises(TokenError):
            decode_token(token)

    def test_levanta_erro_para_token_malformado(self):
        """2.8 - Erro para token malformado."""
        with pytest.raises(TokenError):
            decode_token("token.invalido")

    def test_levanta_erro_para_assinatura_invalida(self):
        """2.9 - Erro para assinatura inválida."""
        settings = get_settings()

        # Cria token com chave diferente
        fake_token = jwt.encode(
            {"sub": "user-123", "type": "access"},
            "chave_errada",
            algorithm=settings.jwt_algorithm,
        )

        with pytest.raises(TokenError):
            decode_token(fake_token)

    def test_levanta_erro_para_algoritmo_diferente(self):
        """2.10 - Erro para algoritmo diferente."""
        settings = get_settings()

        # Cria token com algoritmo diferente (HS384)
        fake_token = jwt.encode(
            {"sub": "user-123", "type": "access"},
            settings.jwt_secret_key,
            algorithm="HS384",
        )

        with pytest.raises(TokenError):
            decode_token(fake_token)


class TestGetTokenExpiry:
    """Testes para a função get_token_expiry."""

    def test_retorna_datetime_para_token_valido(self):
        """Extrai data de expiração de token válido."""
        token = create_access_token("user-123")
        expiry = get_token_expiry(token)

        assert expiry is not None

    def test_retorna_none_para_token_invalido(self):
        """Retorna None para token inválido."""
        expiry = get_token_expiry("token.invalido.aqui")
        assert expiry is None
