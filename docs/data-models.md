# Modelos de Dados

Os modelos são definidos em `src/app/core/models/index.ts` e representam todas as entidades do domínio educacional.

## `Module` — Módulo de aprendizado

```typescript
interface Module {
  id: ModuleId;              // 'fundamentals' | 'intervals' | 'scales' | 'chords' | 'mixed'
  nameKey: string;           // chave i18n para o nome exibido
  icon: string;              // ícone Material
  color: string;             // cor de destaque (#hex)
  order: number;             // ordem de exibição
  requiredModuleId?: ModuleId; // módulo precedente obrigatório
  minXpToUnlock: number;     // XP mínimo para desbloquear
  exerciseIds: string[];     // lista de IDs de exercícios do módulo
}
```

## `Exercise` — Exercício educacional

Todos os exercícios estendem `BaseExercise`:

```typescript
interface BaseExercise {
  id: string;
  moduleId: ModuleId;
  type: 'rhythm' | 'interval' | 'chord';
  difficulty: 1 | 2 | 3;   // 1=fácil, 2=médio, 3=difícil
  xpReward: number;         // XP ganho ao acertar
  conceptKey: string;       // i18n: nome do conceito
  questionKey: string;      // i18n: texto da pergunta
  explanationKey?: string;  // i18n: explicação pós-resposta
}
```

## `UserProgress` — Progresso do aluno

```typescript
interface UserProgress {
  xp: number;                        // XP total acumulado
  level: number;                     // nível atual (100 XP por nível)
  streak: number;                    // dias seguidos de prática
  lastPracticeDate: string | null;   // data da última sessão (YYYY-MM-DD)
  unlockedModuleIds: ModuleId[];     // módulos disponíveis
  completedModuleIds: ModuleId[];    // módulos 100% concluídos
  earnedAchievementIds: string[];    // IDs de conquistas desbloqueadas
  exerciseHistory: ExerciseResult[]; // histórico completo de tentativas
  dailyMissions: DailyMission[];     // missões do dia atual
  totalPracticeMs: number;           // tempo total de prática em ms
}
```

Todo o progresso é **persistido no `localStorage`** via `StorageService` e, quando o usuário está autenticado, também **sincronizado com o backend** (ver seção [Persistência dupla](#persistência-dupla-localstorage--backend) abaixo).

## Modelos de autenticação (frontend)

Definidos em `src/app/core/auth/auth.models.ts`:

```typescript
interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;   // "bearer"
  expiresIn: number;   // segundos até o access token expirar
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: string };
```

`AuthTokens` é persistido no `localStorage` sob a chave `duomusic_tokens` (ver [StorageService](services.md#storageservice--persistência-local)).

## Modelos do backend (SQLAlchemy)

O backend define quatro tabelas em `backend/app/models/`, todas com `id: str` (UUID) como chave primária:

### `User` (`db_user.py`)

```python
class User(Base):
    __tablename__ = "users"

    id: str
    email: str                      # único, indexado
    hashed_password: str
    display_name: str | None
    is_active: bool                 # False após soft delete
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None

    progress: UserProgress          # relacionamento 1:1
    exercise_history: list[ExerciseHistory]
    refresh_tokens: list[RefreshToken]
```

### `RefreshToken` (`db_refresh_token.py`)

```python
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: str
    user_id: str                    # FK -> users.id, ondelete="CASCADE"
    token_hash: str                 # hash do token, único
    expires_at: datetime
    revoked: bool                   # marcado True em logout/rotação/exclusão de conta
    created_at: datetime
```

### `UserProgress` (`db_user_progress.py`)

Espelha o `UserProgress` do frontend, mas do lado do servidor — é a fonte de verdade sincronizada entre dispositivos:

```python
class UserProgress(Base):
    __tablename__ = "user_progress"

    id: str
    user_id: str                    # FK -> users.id, único (1:1)
    xp: int
    level: int
    streak: int
    last_practice_date: date | None
    unlocked_module_ids: list       # JSON
    completed_module_ids: list      # JSON
    earned_achievement_ids: list    # JSON
    daily_missions: list            # JSON
    daily_missions_date: date | None
    total_practice_ms: int
    synced_at: datetime
```

### `ExerciseHistory` (`db_exercise_history.py`)

```python
class ExerciseHistory(Base):
    __tablename__ = "exercise_history"

    id: str
    user_id: str                    # FK -> users.id, indexado
    exercise_id: str
    module_id: str
    correct: bool
    xp_earned: int
    attempted_at: datetime          # indexado
    duration_ms: int
```

## Persistência dupla (localStorage + backend)

Com a autenticação, o `UserProgress` passa a ter **duas cópias**:

1. **Local** — `localStorage` (`duomusic_progress`), sempre disponível, funciona offline
2. **Remota** — tabela `user_progress` no backend, sincronizada via `PUT /api/users/me/progress`

A sincronização usa uma estratégia de **merge não destrutivo** (implementada em `UserProgressService.sync_progress`):

| Campo | Estratégia de merge |
|-------|----------------------|
| XP, streak | Maior valor vence |
| Módulos desbloqueados/concluídos, conquistas | União dos conjuntos |
| Missões diárias | Dados mais recentes vencem |

Se o backend estiver indisponível (`backendOffline`), a aplicação continua funcionando apenas com o `localStorage`.
