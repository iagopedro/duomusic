# Plano de Implementação: Sistema de Autenticação

Este documento detalha a arquitetura e os passos para implementar autenticação de usuários no DuoMusic.

---

## 1. Visão Geral da Mudança

### 1.1 Estado Atual
- Progresso do usuário é armazenado **apenas no localStorage** do navegador
- Não há identificação de usuário — qualquer pessoa no mesmo dispositivo compartilha o progresso
- Dados podem ser perdidos se o navegador for limpo

### 1.2 Estado Desejado
- Usuários podem **criar conta** e **fazer login** com email/senha
- Progresso é **sincronizado com o backend** e persiste entre dispositivos
- Suporte para uso **offline** (localStorage como cache, sincronização ao reconectar)

### 1.3 Escopo da Implementação (MVP)
| Incluído | Fora do escopo (futura iteração) |
|----------|----------------------------------|
| Registro com email/senha | OAuth (Google, GitHub) |
| Login com email/senha | Verificação de email |
| Logout | Recuperação de senha |
| JWT com refresh token | Autenticação 2FA |
| **SQLAlchemy ORM (agnóstico)** | Admin panel |
| SQLite (dev) / PostgreSQL (prod) | |
| Guards de rota autenticada | |

---

## 2. Arquitetura do Backend

### 2.1 Novas Dependências
```txt
# Adicionar ao requirements.txt
sqlalchemy>=2.0.0
alembic>=1.13.0
passlib[bcrypt]>=1.7.4
python-jose[cryptography]>=3.3.0
python-multipart>=0.0.9
aiosqlite>=0.19.0           # SQLite async (desenvolvimento)
asyncpg>=0.29.0             # PostgreSQL async (produção)
greenlet>=3.0.0             # Necessário para SQLAlchemy async
```

### 2.2 Estrutura de Arquivos (Novos)
```
backend/
├── alembic/                    # Migrações de banco
│   ├── versions/
│   │   └── 001_create_users_table.py
│   └── env.py
├── alembic.ini
├── app/
│   ├── database.py             # Configuração SQLAlchemy + engine
│   ├── auth/                   # NOVO: módulo de autenticação
│   │   ├── __init__.py
│   │   ├── dependencies.py     # get_current_user, get_current_active_user
│   │   ├── jwt.py              # Criação e validação de tokens
│   │   ├── password.py         # Hash e verificação de senhas
│   │   └── schemas.py          # Pydantic schemas (registro, login, token)
│   ├── models/
│   │   ├── user.py             # NOVO: modelo SQLAlchemy User
│   │   └── progress.py         # NOVO: modelo UserProgress (banco)
│   ├── routers/
│   │   └── auth.py             # NOVO: endpoints /auth/*
│   └── services/
│       ├── user_service.py     # NOVO: CRUD de usuários
│       └── progress_service.py # NOVO: sincronização de progresso
```

### 2.3 Modelo de Dados (ORM Agnóstico)

> **IMPORTANTE**: Usamos SQLAlchemy ORM com tipos portáveis. Nenhuma query SQL raw
> é permitida. O banco é configurado via `DATABASE_URL`:
> - **Dev**: `sqlite+aiosqlite:///./duomusic.db`
> - **Prod**: `postgresql+asyncpg://user:pass@host/db`

#### Tabela `users`
```python
# Tipos portáveis — funcionam em SQLite e PostgreSQL
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # UUID como string
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relacionamentos
    progress: Mapped["UserProgress"] = relationship(back_populates="user", uselist=False)
    exercise_history: Mapped[list["ExerciseHistory"]] = relationship(back_populates="user")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user")
```

#### Tabela `user_progress`
```python
class UserProgress(Base):
    __tablename__ = "user_progress"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    last_practice_date: Mapped[date | None] = mapped_column(Date)
    # JSON columns — SQLAlchemy JSON type é portável
    unlocked_module_ids: Mapped[list] = mapped_column(JSON, default=lambda: ["fundamentals"])
    completed_module_ids: Mapped[list] = mapped_column(JSON, default=list)
    earned_achievement_ids: Mapped[list] = mapped_column(JSON, default=list)
    total_practice_ms: Mapped[int] = mapped_column(BigInteger, default=0)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="progress")
```

#### Tabela `exercise_history`
```python
class ExerciseHistory(Base):
    __tablename__ = "exercise_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    exercise_id: Mapped[str] = mapped_column(String(50), nullable=False)
    module_id: Mapped[str] = mapped_column(String(50), nullable=False)
    correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped["User"] = relationship(back_populates="exercise_history")
```

#### Tabela `refresh_tokens`
```python
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")
```

### 2.4 Endpoints da API

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| `POST` | `/auth/register` | Cria nova conta | ❌ |
| `POST` | `/auth/login` | Retorna access + refresh token | ❌ |
| `POST` | `/auth/refresh` | Gera novo access token | Refresh token |
| `POST` | `/auth/logout` | Revoga refresh token | ✅ |
| `GET` | `/auth/me` | Retorna dados do usuário logado | ✅ |
| `PUT` | `/auth/me` | Atualiza display_name | ✅ |
| `DELETE` | `/auth/me` | Deleta conta (soft delete) | ✅ |
| `GET` | `/users/me/progress` | Retorna progresso do usuário | ✅ |
| `PUT` | `/users/me/progress` | Sincroniza progresso | ✅ |
| `GET` | `/users/me/history` | Retorna histórico de exercícios | ✅ |

### 2.5 Schemas Pydantic

```python
# app/auth/schemas.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=50)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos até expirar

class TokenRefresh(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str | None
    created_at: datetime
    
class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=50)
```

### 2.6 Configuração JWT

```python
# Adicionar ao config.py
class Settings(BaseSettings):
    # ... configurações existentes ...
    
    # Database — URL async (aiosqlite para SQLite, asyncpg para PostgreSQL)
    database_url: str = "sqlite+aiosqlite:///./duomusic.db"
    
    # JWT
    jwt_secret_key: str = ""  # Obrigatório em produção
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
```

### 2.7 Middleware e Dependencies

```python
# app/auth/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Extrai e valida o usuário do token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await user_service.get_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    """Verifica se o usuário está ativo."""
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user
```

---

## 3. Arquitetura do Frontend (Angular)

### 3.1 Estrutura de Arquivos (Novos)

```
src/app/
├── core/
│   ├── auth/                        # NOVO: módulo de autenticação
│   │   ├── auth.interceptor.ts      # Adiciona Bearer token às requisições
│   │   ├── auth.service.ts          # Login, logout, registro, estado
│   │   ├── auth.service.spec.ts
│   │   ├── auth.guard.ts            # Protege rotas autenticadas
│   │   ├── auth.guard.spec.ts
│   │   └── auth.models.ts           # Interfaces User, Token, etc.
│   ├── services/
│   │   └── sync.service.ts          # NOVO: sincronização de progresso
│
├── features/
│   ├── auth/                        # NOVO: feature de autenticação
│   │   ├── auth.routes.ts
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   ├── login.component.scss
│   │   │   └── login.component.spec.ts
│   │   └── register/
│   │       ├── register.component.ts
│   │       ├── register.component.html
│   │       ├── register.component.scss
│   │       └── register.component.spec.ts
```

### 3.2 Modelos TypeScript

```typescript
// src/app/core/auth/auth.models.ts
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export type AuthState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: string };
```

### 3.3 AuthService (Signals)

```typescript
// src/app/core/auth/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  private readonly _state = signal<AuthState>({ status: 'idle' });
  readonly state = this._state.asReadonly();

  readonly isAuthenticated = computed(() => 
    this._state().status === 'authenticated'
  );
  
  readonly currentUser = computed(() => {
    const state = this._state();
    return state.status === 'authenticated' ? state.user : null;
  });

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const tokens = this.storage.get<AuthTokens | null>('duomusic_tokens', null);
    if (tokens) {
      this.validateAndLoadUser(tokens);
    } else {
      this._state.set({ status: 'unauthenticated' });
    }
  }

  async login(credentials: LoginRequest): Promise<void> { /* ... */ }
  async register(data: RegisterRequest): Promise<void> { /* ... */ }
  async logout(): Promise<void> { /* ... */ }
  async refreshToken(): Promise<boolean> { /* ... */ }
}
```

### 3.4 HTTP Interceptor

```typescript
// src/app/core/auth/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const storage = inject(StorageService);
  
  // URLs que não precisam de autenticação
  const publicUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
  if (publicUrls.some(url => req.url.includes(url))) {
    return next(req);
  }

  const tokens = storage.get<AuthTokens | null>('duomusic_tokens', null);
  if (tokens?.accessToken) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${tokens.accessToken}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(success => success ? next(req) : throwError(() => error))
        );
      }
      return throwError(() => error);
    })
  );
};
```

### 3.5 Auth Guard

```typescript
// src/app/core/auth/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
```

### 3.6 Rotas Atualizadas

```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard, onboardingGuard],
    loadChildren: () => import('./features/onboarding/onboarding.routes').then(m => m.ONBOARDING_ROUTES),
  },
  {
    path: 'home',
    canActivate: [authGuard, requireOnboardingGuard],
    loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES),
  },
  // ... outras rotas com authGuard
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
];
```

---

## 4. Configuração do Banco de Dados

> A aplicação é **agnóstica de banco de dados**. Em desenvolvimento usamos SQLite
> (arquivo local), em produção PostgreSQL. A troca é feita apenas via `DATABASE_URL`.

### 4.1 Estrutura de Arquivos

```
backend/
├── duomusic.db         # Banco SQLite — apenas dev (não comitar)
├── duomusic.db-journal # Arquivo de journal SQLite (não comitar)
├── alembic.ini         # Configuração do Alembic
└── alembic/
    ├── env.py          # Configurado para async + multi-DB
    ├── script.py.mako
    └── versions/
        ├── 001_create_auth_tables.py
        └── 002_create_progress_tables.py
```

### 4.2 Configuração do SQLAlchemy (Async + Agnóstico)

```python
# app/database.py
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import get_settings

settings = get_settings()


def _get_connect_args() -> dict:
    """
    Retorna argumentos de conexão específicos do driver.
    SQLite precisa de check_same_thread=False; PostgreSQL não precisa de nada.
    """
    if settings.database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


engine = create_async_engine(
    settings.database_url,
    connect_args=_get_connect_args(),
    echo=settings.debug,
    # Pool configuration — funciona para ambos os bancos
    pool_pre_ping=True,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Classe base para todos os modelos SQLAlchemy."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency que fornece uma sessão assíncrona do banco.
    Uso: db: AsyncSession = Depends(get_db)
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """
    Cria todas as tabelas (apenas para desenvolvimento/testes).
    Em produção, use Alembic migrations.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Fecha o pool de conexões."""
    await engine.dispose()
```

### 4.3 Configuração do Alembic (Multi-DB)

```python
# alembic/env.py — Trecho relevante
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import get_settings
from app.database import Base
# Importar todos os models para o metadata
from app.models import user, progress, refresh_token  # noqa: F401

settings = get_settings()
config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Gera SQL sem conexão com o banco."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Importante: renderiza tipos de forma portável
        render_as_batch=url.startswith("sqlite"),  # SQLite não suporta ALTER
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=settings.database_url.startswith("sqlite"),
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Executa migrations com conexão async."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

### 4.4 Inicialização do Banco

```bash
# Comandos para setup inicial (desenvolvimento com SQLite)
cd backend
pip install -r requirements.txt

# Inicializar Alembic (apenas uma vez)
alembic init alembic

# Criar migration inicial
alembic revision --autogenerate -m "create auth tables"

# Aplicar migrations
alembic upgrade head

# Para PostgreSQL (produção), basta trocar DATABASE_URL:
# export DUOMUSIC_DATABASE_URL=postgresql+asyncpg://user:pass@host/db
# alembic upgrade head
```

### 4.5 Script de Teste Rápido (Opcional)

```python
# scripts/check_db.py — Verifica se o banco está acessível
import asyncio
from app.database import engine, init_db

async def main():
    print(f"Conectando a: {engine.url}")
    await init_db()
    print("✅ Banco inicializado com sucesso!")

if __name__ == "__main__":
    asyncio.run(main())
```

### 4.6 .gitignore Atualizado

```gitignore
# Database
*.db
*.db-journal
*.db-shm
*.db-wal
```

---

## 5. Fluxo de Autenticação

### 5.1 Registro
```
┌─────────┐          ┌─────────┐          ┌──────────┐
│ Angular │          │ FastAPI │          │ Database │
└────┬────┘          └────┬────┘          └────┬─────┘
     │                    │                    │
     │ POST /auth/register│                    │
     │ {email, password}  │                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │ Valida email único │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │                    │
     │                    │ Hash password      │
     │                    │ (bcrypt)           │
     │                    │                    │
     │                    │ INSERT user        │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │                    │
     │                    │ Gera tokens        │
     │                    │ (JWT)              │
     │                    │                    │
     │  {access_token,    │                    │
     │   refresh_token}   │                    │
     │<───────────────────│                    │
     │                    │                    │
     │ Salva em storage   │                    │
     │ Redireciona /home  │                    │
```

### 5.2 Login
```
┌─────────┐          ┌─────────┐          ┌──────────┐
│ Angular │          │ FastAPI │          │ Database │
└────┬────┘          └────┬────┘          └────┬─────┘
     │                    │                    │
     │ POST /auth/login   │                    │
     │ {email, password}  │                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │ Busca user por email│
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │                    │
     │                    │ Verifica password  │
     │                    │ (bcrypt.verify)    │
     │                    │                    │
     │                    │ Atualiza last_login│
     │                    │───────────────────>│
     │                    │                    │
     │  {access_token,    │                    │
     │   refresh_token}   │                    │
     │<───────────────────│                    │
```

### 5.3 Refresh Token
```
┌─────────┐          ┌─────────┐          ┌──────────┐
│ Angular │          │ FastAPI │          │ Database │
└────┬────┘          └────┬────┘          └────┬─────┘
     │                    │                    │
     │ POST /auth/refresh │                    │
     │ {refresh_token}    │                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │ Valida refresh     │
     │                    │ token (JWT + DB)   │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │                    │
     │                    │ Gera novo access   │
     │                    │ token              │
     │                    │                    │
     │  {access_token,    │                    │
     │   refresh_token}   │                    │
     │<───────────────────│                    │
```

---

## 6. Casos de Teste

### 6.1 Backend — Testes Unitários

#### `tests/test_auth_password.py`
```python
class TestPasswordHashing:
    """Testes para app/auth/password.py"""
    
    def test_hash_password_retorna_string_diferente_do_input(self): ...
    def test_hash_password_gera_hashes_diferentes_para_mesma_senha(self): ...
    def test_verify_password_retorna_true_para_senha_correta(self): ...
    def test_verify_password_retorna_false_para_senha_incorreta(self): ...
    def test_hash_password_funciona_com_caracteres_especiais(self): ...
    def test_hash_password_funciona_com_senha_unicode(self): ...
```

#### `tests/test_auth_jwt.py`
```python
class TestJWTCreation:
    """Testes para criação de tokens JWT."""
    
    def test_create_access_token_retorna_string_jwt_valida(self): ...
    def test_create_access_token_inclui_user_id_no_payload(self): ...
    def test_create_access_token_inclui_expiracao(self): ...
    def test_create_refresh_token_tem_expiracao_maior_que_access(self): ...
    
class TestJWTValidation:
    """Testes para validação de tokens JWT."""
    
    def test_decode_token_retorna_payload_para_token_valido(self): ...
    def test_decode_token_levanta_erro_para_token_expirado(self): ...
    def test_decode_token_levanta_erro_para_token_invalido(self): ...
    def test_decode_token_levanta_erro_para_assinatura_errada(self): ...
```

#### `tests/test_user_service.py`
```python
class TestUserCreation:
    """Testes para criação de usuários."""
    
    def test_create_user_salva_no_banco(self): ...
    def test_create_user_retorna_user_sem_password(self): ...
    def test_create_user_gera_uuid_automaticamente(self): ...
    def test_create_user_levanta_erro_para_email_duplicado(self): ...
    def test_create_user_normaliza_email_para_lowercase(self): ...
    def test_create_user_valida_formato_de_email(self): ...
    def test_create_user_valida_tamanho_minimo_de_senha(self): ...

class TestUserRetrieval:
    """Testes para busca de usuários."""
    
    def test_get_by_id_retorna_user_existente(self): ...
    def test_get_by_id_retorna_none_para_id_inexistente(self): ...
    def test_get_by_email_retorna_user_existente(self): ...
    def test_get_by_email_retorna_none_para_email_inexistente(self): ...
    def test_get_by_email_busca_case_insensitive(self): ...

class TestUserAuthentication:
    """Testes para autenticação de usuários."""
    
    def test_authenticate_retorna_user_para_credenciais_validas(self): ...
    def test_authenticate_retorna_none_para_email_inexistente(self): ...
    def test_authenticate_retorna_none_para_senha_incorreta(self): ...
    def test_authenticate_atualiza_last_login_at(self): ...
    def test_authenticate_retorna_none_para_user_inativo(self): ...

class TestUserUpdate:
    """Testes para atualização de usuários."""
    
    def test_update_display_name_altera_valor(self): ...
    def test_update_atualiza_updated_at(self): ...
    def test_soft_delete_marca_is_active_false(self): ...
```

### 6.2 Backend — Testes de Integração

#### `tests/test_auth_routers.py`
```python
class TestRegisterEndpoint:
    """Testes para POST /auth/register"""
    
    def test_register_retorna_201_para_dados_validos(self): ...
    def test_register_retorna_tokens_jwt(self): ...
    def test_register_cria_user_no_banco(self): ...
    def test_register_retorna_422_para_email_invalido(self): ...
    def test_register_retorna_422_para_senha_curta(self): ...
    def test_register_retorna_409_para_email_duplicado(self): ...
    def test_register_retorna_422_para_campos_faltando(self): ...

class TestLoginEndpoint:
    """Testes para POST /auth/login"""
    
    def test_login_retorna_200_para_credenciais_validas(self): ...
    def test_login_retorna_access_e_refresh_token(self): ...
    def test_login_retorna_401_para_email_inexistente(self): ...
    def test_login_retorna_401_para_senha_incorreta(self): ...
    def test_login_retorna_401_para_user_inativo(self): ...
    def test_login_atualiza_last_login_at(self): ...

class TestRefreshEndpoint:
    """Testes para POST /auth/refresh"""
    
    def test_refresh_retorna_novo_access_token(self): ...
    def test_refresh_retorna_401_para_token_expirado(self): ...
    def test_refresh_retorna_401_para_token_revogado(self): ...
    def test_refresh_retorna_401_para_token_invalido(self): ...

class TestLogoutEndpoint:
    """Testes para POST /auth/logout"""
    
    def test_logout_revoga_refresh_token(self): ...
    def test_logout_retorna_204(self): ...
    def test_logout_requer_autenticacao(self): ...

class TestMeEndpoint:
    """Testes para GET/PUT/DELETE /auth/me"""
    
    def test_get_me_retorna_dados_do_usuario_logado(self): ...
    def test_get_me_retorna_401_sem_token(self): ...
    def test_get_me_retorna_401_com_token_expirado(self): ...
    def test_put_me_atualiza_display_name(self): ...
    def test_delete_me_desativa_conta(self): ...

class TestProtectedEndpoints:
    """Testes de autenticação em endpoints protegidos."""
    
    def test_endpoint_protegido_retorna_401_sem_token(self): ...
    def test_endpoint_protegido_retorna_401_com_token_invalido(self): ...
    def test_endpoint_protegido_funciona_com_token_valido(self): ...
```

#### `tests/test_progress_sync.py`
```python
class TestProgressSync:
    """Testes para sincronização de progresso."""
    
    def test_get_progress_retorna_progresso_do_usuario(self): ...
    def test_get_progress_retorna_progresso_default_para_novo_user(self): ...
    def test_put_progress_atualiza_progresso(self): ...
    def test_put_progress_faz_merge_com_progresso_servidor(self): ...
    def test_get_history_retorna_historico_paginado(self): ...
```

### 6.3 Frontend — Testes Unitários (Vitest)

#### `auth.service.spec.ts`
```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('deve atualizar state para authenticated em caso de sucesso', async () => {});
    it('deve salvar tokens no storage em caso de sucesso', async () => {});
    it('deve atualizar state para error em caso de falha', async () => {});
    it('deve limpar tokens antigos antes de salvar novos', async () => {});
  });

  describe('register', () => {
    it('deve criar conta e fazer login automaticamente', async () => {});
    it('deve propagar erro de email duplicado', async () => {});
    it('deve validar formato de email antes de enviar', async () => {});
  });

  describe('logout', () => {
    it('deve remover tokens do storage', async () => {});
    it('deve atualizar state para unauthenticated', async () => {});
    it('deve chamar endpoint de logout no backend', async () => {});
    it('deve redirecionar para /auth/login', async () => {});
  });

  describe('refreshToken', () => {
    it('deve atualizar access token quando refresh é válido', async () => {});
    it('deve fazer logout quando refresh é inválido', async () => {});
    it('deve retornar false quando não há refresh token', async () => {});
  });

  describe('initializeAuth', () => {
    it('deve restaurar sessão de tokens salvos', async () => {});
    it('deve definir unauthenticated se não há tokens', async () => {});
    it('deve fazer refresh se access token está expirado', async () => {});
  });

  describe('computed signals', () => {
    it('isAuthenticated deve retornar true quando autenticado', () => {});
    it('currentUser deve retornar user quando autenticado', () => {});
    it('currentUser deve retornar null quando não autenticado', () => {});
  });
});
```

#### `auth.interceptor.spec.ts`
```typescript
describe('authInterceptor', () => {
  it('não deve adicionar header em rotas públicas', () => {});
  it('deve adicionar Bearer token em rotas protegidas', () => {});
  it('deve tentar refresh quando recebe 401', () => {});
  it('deve fazer logout quando refresh falha', () => {});
  it('deve reenviar request original após refresh bem-sucedido', () => {});
});
```

#### `auth.guard.spec.ts`
```typescript
describe('authGuard', () => {
  it('deve permitir acesso quando autenticado', () => {});
  it('deve redirecionar para login quando não autenticado', () => {});
});

describe('guestGuard', () => {
  it('deve permitir acesso quando não autenticado', () => {});
  it('deve redirecionar para home quando autenticado', () => {});
});
```

#### `login.component.spec.ts`
```typescript
describe('LoginComponent', () => {
  describe('formulário', () => {
    it('deve desabilitar submit quando form é inválido', () => {});
    it('deve mostrar erro para email inválido', () => {});
    it('deve mostrar erro para senha vazia', () => {});
    it('deve habilitar submit quando form é válido', () => {});
  });

  describe('submit', () => {
    it('deve chamar authService.login com credenciais', () => {});
    it('deve mostrar loading durante requisição', () => {});
    it('deve mostrar mensagem de erro em caso de falha', () => {});
    it('deve redirecionar para home em caso de sucesso', () => {});
  });

  describe('navegação', () => {
    it('deve ter link para página de registro', () => {});
  });
});
```

#### `register.component.spec.ts`
```typescript
describe('RegisterComponent', () => {
  describe('formulário', () => {
    it('deve validar email obrigatório', () => {});
    it('deve validar formato de email', () => {});
    it('deve validar senha mínima de 8 caracteres', () => {});
    it('deve validar confirmação de senha', () => {});
    it('display_name deve ser opcional', () => {});
  });

  describe('submit', () => {
    it('deve chamar authService.register com dados', () => {});
    it('deve mostrar erro de email duplicado', () => {});
    it('deve redirecionar para onboarding em caso de sucesso', () => {});
  });
});
```

### 6.4 Testes E2E (Playwright — Futuro)

```typescript
// e2e/auth.spec.ts
describe('Fluxo de Autenticação', () => {
  test('usuário pode criar conta e fazer login', async ({ page }) => {});
  test('usuário não pode acessar /home sem login', async ({ page }) => {});
  test('sessão persiste após refresh da página', async ({ page }) => {});
  test('logout redireciona para login', async ({ page }) => {});
  test('refresh token mantém sessão ativa', async ({ page }) => {});
});
```

---

## 7. Ordem de Implementação

### Fase 1: Infraestrutura de Banco (Backend)
1. Adicionar dependências ao `requirements.txt`
2. Criar `app/database.py` com configuração SQLAlchemy
3. Configurar Alembic para migrações
4. Criar modelo `User` e migration inicial
5. Criar fixtures de teste com banco em memória

### Fase 2: Autenticação (Backend)
6. Implementar `app/auth/password.py` (hash/verify)
7. Implementar `app/auth/jwt.py` (create/decode tokens)
8. Implementar `app/auth/schemas.py` (Pydantic models)
9. Implementar `app/services/user_service.py`
10. Implementar `app/routers/auth.py` (endpoints)
11. Implementar `app/auth/dependencies.py` (get_current_user)
12. Adicionar testes unitários e de integração

### Fase 3: Sincronização de Progresso (Backend)
13. Criar modelos `UserProgress` e `ExerciseHistory`
14. Criar migrations para tabelas de progresso
15. Implementar `app/services/progress_service.py`
16. Adicionar endpoints `/users/me/progress`
17. Adicionar testes

### Fase 4: Autenticação (Frontend)
18. Criar `auth.models.ts`
19. Implementar `auth.service.ts` com signals
20. Implementar `auth.interceptor.ts`
21. Implementar `auth.guard.ts` e `guest.guard.ts`
22. Criar componentes `login` e `register`
23. Atualizar rotas em `app.routes.ts`
24. Adicionar testes unitários

### Fase 5: Sincronização (Frontend)
25. Implementar `sync.service.ts`
26. Modificar `progress.service.ts` para usar sync
27. Adicionar lógica de merge offline/online
28. Adicionar testes

### Fase 6: Integração e Polish
29. Testes de integração end-to-end
30. Tratamento de erros e edge cases
31. Atualizar documentação
32. Code review e refactoring

---

## 8. Checklist de Segurança

- [ ] Senhas hasheadas com bcrypt (work factor ≥ 12)
- [ ] JWT com secret forte (≥ 256 bits)
- [ ] Access tokens com vida curta (30 min)
- [ ] Refresh tokens rotacionados
- [ ] Rate limiting em endpoints de auth
- [ ] Validação de email no registro
- [ ] Password mínimo de 8 caracteres
- [ ] Proteção contra timing attacks na verificação de senha
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (já implementados)
- [ ] Soft delete de usuários (não hard delete)
- [ ] Logs de tentativas de login falhas

---

## 9. Variáveis de Ambiente

```env
# .env.development (SQLite — desenvolvimento local)
DUOMUSIC_DEBUG=true
DUOMUSIC_DATABASE_URL=sqlite+aiosqlite:///./duomusic.db
DUOMUSIC_JWT_SECRET_KEY=dev-secret-change-in-production-at-least-32-chars
DUOMUSIC_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
DUOMUSIC_JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

```env
# .env.production (PostgreSQL — produção)
DUOMUSIC_DEBUG=false
DUOMUSIC_DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/duomusic
DUOMUSIC_JWT_SECRET_KEY=<gerar-com-openssl-rand-base64-32>
DUOMUSIC_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
DUOMUSIC_JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

```env
# .env.test (SQLite em memória — testes)
DUOMUSIC_DEBUG=false
DUOMUSIC_DATABASE_URL=sqlite+aiosqlite:///:memory:
DUOMUSIC_JWT_SECRET_KEY=test-secret-key
DUOMUSIC_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=5
DUOMUSIC_JWT_REFRESH_TOKEN_EXPIRE_DAYS=1
```

---

## 10. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| ~~SQLite não escala para muitos usuários~~ | ~~Média~~ | ~~Alto~~ | ✅ Arquitetura agnóstica — basta trocar `DATABASE_URL` |
| Perda de progresso na sincronização | Baixa | Alto | Merge conservador (maior XP vence) |
| Tokens vazados | Baixa | Alto | Refresh token rotation, short-lived access |
| Usuário esquece senha | Alta | Médio | Implementar reset de senha (fase 2) |
| Diferenças de comportamento SQLite vs PostgreSQL | Baixa | Médio | Testes rodam em ambos; sem SQL raw |

---

## 11. Checklist de Portabilidade (SQLite ↔ PostgreSQL)

- [x] Usar SQLAlchemy ORM — nunca queries SQL raw
- [x] Tipos portáveis: `String`, `Integer`, `Boolean`, `DateTime(timezone=True)`, `JSON`
- [x] UUID como `String(36)` (não usar tipo UUID nativo)
- [x] `BigInteger` para campos que podem exceder 2^31 (ex: `total_practice_ms`)
- [x] `server_default=func.now()` ao invés de `default=datetime.utcnow`
- [x] `DateTime(timezone=True)` para timestamps com timezone
- [x] `render_as_batch=True` no Alembic para SQLite (não suporta ALTER)
- [x] Testes com SQLite em memória (`:memory:`)
- [x] Conexão async: `aiosqlite` (SQLite) / `asyncpg` (PostgreSQL)
- [x] `pool_pre_ping=True` para detectar conexões mortas
