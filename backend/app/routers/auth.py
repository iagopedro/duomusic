"""Router de autenticação."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_active_user
from ..auth.jwt import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_expiry,
)
from ..auth.schemas import (
    Token,
    TokenRefresh,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from ..config import get_settings
from ..database import get_db
from ..models.db_user import User
from ..services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Registra um novo usuário.
    
    Returns:
        Tokens de acesso e refresh.
    """
    service = UserService(db)

    try:
        user = await service.create_user(user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )

    # Gera tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Armazena refresh token
    expiry = get_token_expiry(refresh_token)
    if expiry:
        await service.store_refresh_token(user.id, refresh_token, expiry)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Autentica um usuário com email e senha.
    
    Usa OAuth2PasswordRequestForm para compatibilidade com Swagger UI.
    O campo 'username' recebe o email do usuário.
    
    Returns:
        Tokens de acesso e refresh.
    """
    service = UserService(db)

    user = await service.authenticate(form_data.username, form_data.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Gera tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Armazena refresh token
    expiry = get_token_expiry(refresh_token)
    if expiry:
        await service.store_refresh_token(user.id, refresh_token, expiry)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post("/login/json", response_model=Token)
async def login_json(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Autentica um usuário com email e senha via JSON.
    
    Alternativa ao endpoint /login para uso programático.
    
    Returns:
        Tokens de acesso e refresh.
    """
    service = UserService(db)

    user = await service.authenticate(credentials.email, credentials.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Gera tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Armazena refresh token
    expiry = get_token_expiry(refresh_token)
    if expiry:
        await service.store_refresh_token(user.id, refresh_token, expiry)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post("/refresh", response_model=Token)
async def refresh(
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_db),
):
    """
    Gera um novo access token usando o refresh token.
    
    Returns:
        Novos tokens de acesso e refresh.
    """
    service = UserService(db)

    # Valida refresh token no banco
    stored_token = await service.validate_refresh_token(token_data.refresh_token)

    if stored_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decodifica para obter user_id
    try:
        payload = decode_token(token_data.refresh_token)
        user_id = payload.get("sub")
        token_type = payload.get("type")

        if not user_id or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except TokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Revoga o refresh token antigo (rotation)
    await service.revoke_refresh_token(token_data.refresh_token)

    # Gera novos tokens
    access_token = create_access_token(user_id)
    new_refresh_token = create_refresh_token(user_id)

    # Armazena novo refresh token
    expiry = get_token_expiry(new_refresh_token)
    if expiry:
        await service.store_refresh_token(user_id, new_refresh_token, expiry)

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    token_data: TokenRefresh,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Revoga o refresh token (logout).
    
    Requer autenticação via access token.
    """
    service = UserService(db)
    await service.revoke_refresh_token(token_data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """
    Retorna dados do usuário autenticado.
    
    Returns:
        Dados do usuário.
    """
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Atualiza dados do usuário autenticado.
    
    Returns:
        Dados do usuário atualizado.
    """
    service = UserService(db)
    updated_user = await service.update_user(current_user, user_data)
    return UserResponse.model_validate(updated_user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Desativa a conta do usuário autenticado (soft delete).
    
    Também revoga todos os refresh tokens.
    """
    service = UserService(db)
    await service.deactivate_user(current_user)
