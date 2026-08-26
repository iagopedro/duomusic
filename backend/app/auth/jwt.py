"""Funções para criação e validação de tokens JWT."""

import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from ..config import get_settings

settings = get_settings()


class TokenError(Exception):
    """Erro ao processar token JWT."""

    pass


def create_access_token(user_id: str, expires_delta: timedelta | None = None) -> str:
    """
    Cria um access token JWT.
    
    Args:
        user_id: ID do usuário.
        expires_delta: Tempo até expiração. Se None, usa configuração padrão.
        
    Returns:
        Token JWT codificado.
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.jwt_access_token_expire_minutes)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    to_encode = {
        "sub": user_id,
        "type": "access",
        "jti": str(uuid.uuid4()),  # JWT ID único
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str, expires_delta: timedelta | None = None) -> str:
    """
    Cria um refresh token JWT.
    
    Args:
        user_id: ID do usuário.
        expires_delta: Tempo até expiração. Se None, usa configuração padrão.
        
    Returns:
        Token JWT codificado.
    """
    if expires_delta is None:
        expires_delta = timedelta(days=settings.jwt_refresh_token_expire_days)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    to_encode = {
        "sub": user_id,
        "type": "refresh",
        "jti": str(uuid.uuid4()),  # JWT ID único
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """
    Decodifica e valida um token JWT.
    
    Args:
        token: Token JWT codificado.
        
    Returns:
        Payload do token.
        
    Raises:
        TokenError: Se o token for inválido ou expirado.
    """
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        raise TokenError(f"Token inválido: {e}") from e


def get_token_expiry(token: str) -> datetime | None:
    """
    Extrai a data de expiração de um token.
    
    Args:
        token: Token JWT codificado.
        
    Returns:
        Data de expiração ou None se não encontrada.
    """
    try:
        payload = decode_token(token)
        exp = payload.get("exp")
        if exp:
            return datetime.fromtimestamp(exp, tz=timezone.utc)
        return None
    except TokenError:
        return None
