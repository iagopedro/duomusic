"""Serviço de usuários."""

import hashlib
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.password import hash_password, verify_password
from ..auth.schemas import UserCreate, UserUpdate
from ..models.db_refresh_token import RefreshToken
from ..models.db_user import User
from ..models.db_user_progress import UserProgress


class UserService:
    """Serviço para operações com usuários."""

    def __init__(self, db: AsyncSession):
        """Inicializa o serviço com uma sessão do banco."""
        self.db = db

    async def create_user(self, user_data: UserCreate) -> User:
        """
        Cria um novo usuário.
        
        Args:
            user_data: Dados do usuário.
            
        Returns:
            Usuário criado.
            
        Raises:
            ValueError: Se o email já existir.
        """
        # Normaliza email para lowercase
        email = user_data.email.lower()

        # Verifica se email já existe
        existing = await self.get_by_email(email)
        if existing:
            raise ValueError("Email already registered")

        # Cria o usuário
        user = User(
            email=email,
            hashed_password=hash_password(user_data.password),
            display_name=user_data.display_name,
        )

        self.db.add(user)

        try:
            await self.db.flush()
        except IntegrityError as e:
            await self.db.rollback()
            raise ValueError("Email already registered") from e

        # Cria progresso inicial
        progress = UserProgress(user_id=user.id)
        self.db.add(progress)

        await self.db.flush()
        await self.db.refresh(user)

        return user

    async def get_by_id(self, user_id: str) -> User | None:
        """
        Busca um usuário pelo ID.
        
        Args:
            user_id: ID do usuário.
            
        Returns:
            Usuário ou None se não encontrado.
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """
        Busca um usuário pelo email.
        
        Args:
            email: Email do usuário (case-insensitive).
            
        Returns:
            Usuário ou None se não encontrado.
        """
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def authenticate(self, email: str, password: str) -> User | None:
        """
        Autentica um usuário por email e senha.
        
        Args:
            email: Email do usuário.
            password: Senha em texto plano.
            
        Returns:
            Usuário se autenticado, None caso contrário.
        """
        user = await self.get_by_email(email)

        if user is None:
            return None

        if not user.is_active:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        # Atualiza last_login_at
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        return user

    async def update_user(self, user: User, user_data: UserUpdate) -> User:
        """
        Atualiza dados do usuário.
        
        Args:
            user: Usuário a atualizar.
            user_data: Novos dados.
            
        Returns:
            Usuário atualizado.
        """
        if user_data.display_name is not None:
            user.display_name = user_data.display_name

        await self.db.flush()
        await self.db.refresh(user)

        return user

    async def deactivate_user(self, user: User) -> None:
        """
        Desativa um usuário (soft delete).
        
        Args:
            user: Usuário a desativar.
        """
        user.is_active = False

        # Revoga todos os refresh tokens
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user.id,
                RefreshToken.revoked == False,  # noqa: E712
            )
        )
        tokens = result.scalars().all()

        for token in tokens:
            token.revoked = True

        await self.db.flush()

    async def store_refresh_token(
        self, user_id: str, token: str, expires_at: datetime
    ) -> RefreshToken:
        """
        Armazena um refresh token no banco.
        
        Args:
            user_id: ID do usuário.
            token: Token JWT.
            expires_at: Data de expiração.
            
        Returns:
            RefreshToken criado.
        """
        # Hash do token para armazenamento seguro
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

        self.db.add(refresh_token)
        await self.db.flush()

        return refresh_token

    async def validate_refresh_token(self, token: str) -> RefreshToken | None:
        """
        Valida um refresh token.
        
        Args:
            token: Token JWT.
            
        Returns:
            RefreshToken se válido, None caso contrário.
        """
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,  # noqa: E712
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )

        return result.scalar_one_or_none()

    async def revoke_refresh_token(self, token: str) -> bool:
        """
        Revoga um refresh token.
        
        Args:
            token: Token JWT.
            
        Returns:
            True se revogado, False se não encontrado.
        """
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        refresh_token = result.scalar_one_or_none()

        if refresh_token:
            refresh_token.revoked = True
            await self.db.flush()
            return True

        return False

    async def revoke_all_user_tokens(self, user_id: str) -> int:
        """
        Revoga todos os refresh tokens de um usuário.
        
        Args:
            user_id: ID do usuário.
            
        Returns:
            Número de tokens revogados.
        """
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,  # noqa: E712
            )
        )
        tokens = result.scalars().all()

        count = 0
        for token in tokens:
            token.revoked = True
            count += 1

        await self.db.flush()
        return count
