"""Dependências FastAPI para autenticação."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.db_user import User
from .jwt import TokenError, decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extrai e valida o usuário do token JWT.
    
    Args:
        token: Token JWT do header Authorization.
        db: Sessão do banco de dados.
        
    Returns:
        Usuário autenticado.
        
    Raises:
        HTTPException: Se o token for inválido ou usuário não existir.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")

        if user_id is None:
            raise credentials_exception

        if token_type != "access":
            raise credentials_exception

    except TokenError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Verifica se o usuário está ativo.
    
    Args:
        current_user: Usuário do token JWT.
        
    Returns:
        Usuário ativo.
        
    Raises:
        HTTPException: Se o usuário estiver inativo.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user
