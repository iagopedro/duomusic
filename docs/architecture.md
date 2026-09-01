# Arquitetura

O DuoMusic é uma **Single Page Application (SPA)** com roteamento lazy-loaded. Cada feature é um módulo independente carregado apenas quando necessário.

## Visão geral

```
Browser
  └── Angular App (standalone, sem NgModules tradicionais)
        ├── Router (lazy loading por feature)
        ├── Core (serviços singleton injetados globalmente)
        ├── Features (telas da aplicação)
        └── Shared (componentes reutilizáveis)
```

## Fluxo de navegação

```
/ (raiz)                       → redireciona para /auth/login
  └── /auth                    ← rotas públicas (guard: guestGuard)
        ├── /auth/login
        └── /auth/register
  └── /onboarding  ← primeira visita (guards: authGuard, onboardingGuard)
  └── /home        ← tela principal  (guards: authGuard, requireOnboardingGuard)
  └── /practice/:moduleId  ← sessão de prática (guards: authGuard, requireOnboardingGuard)
  └── /achievements        ← conquistas (guards: authGuard, requireOnboardingGuard)
  └── /profile             ← perfil e configurações (guards: authGuard, requireOnboardingGuard)
  └── /offline              ← tela exibida quando o backend está inacessível
  └── **                    → redireciona para /home
```

## Guards de rota

Quatro guards controlam o acesso:

- **`authGuard`** — protege rotas que exigem usuário autenticado; redireciona para `/auth/login` caso não haja sessão válida (verifica `AuthService.isAuthenticated()`)
- **`guestGuard`** — protege as rotas de `/auth` (login/registro); redireciona para `/home` se o usuário já estiver autenticado
- **`onboardingGuard`** — redireciona para `/home` se o onboarding já foi concluído (evita repetição)
- **`requireOnboardingGuard`** — redireciona para `/onboarding` se o usuário ainda não completou a introdução

Todas as rotas protegidas (exceto `/auth` e `/offline`) combinam `authGuard` com os guards de onboarding, garantindo que apenas usuários autenticados acessem o conteúdo pedagógico.

## Estrutura de pastas

```
src/
├── app/
│   ├── app.config.ts          # Bootstrap da aplicação (providers globais)
│   ├── app.routes.ts          # Definição de todas as rotas
│   ├── app.ts                 # Componente raiz
│   │
│   ├── core/                  # Camada de infraestrutura (serviços, modelos, guards)
│   │   ├── auth/
│   │   │   ├── auth.service.ts     # Estado de autenticação (signals) e chamadas à API
│   │   │   ├── auth.guard.ts       # authGuard / guestGuard
│   │   │   ├── auth.interceptor.ts # Injeta Bearer token e renova em 401
│   │   │   └── auth.models.ts      # User, AuthTokens, LoginRequest, RegisterRequest, AuthState
│   │   ├── guards/
│   │   │   └── onboarding.guard.ts
│   │   ├── i18n/
│   │   │   ├── i18n.service.ts    # Serviço de tradução
│   │   │   └── pt-br.ts           # Dicionário em português
│   │   ├── models/
│   │   │   └── index.ts           # Todas as interfaces TypeScript
│   │   ├── services/
│   │   │   ├── api.service.ts     # Carga inicial de módulos/exercícios/conquistas do backend
│   │   │   ├── audio.service.ts   # Síntese de áudio (Web Audio API)
│   │   │   ├── background-track.service.ts # Trilha sonora de fundo
│   │   │   ├── progress.service.ts # Progresso, XP, conquistas
│   │   │   └── settings.service.ts # Preferências do usuário
│   │   └── storage/
│   │       └── storage.service.ts  # Abstração do localStorage
│   │
│   ├── data/                  # Dados estáticos do conteúdo educacional
│   │   ├── achievements.data.ts
│   │   ├── exercises.data.ts
│   │   └── modules.data.ts
│   │
│   ├── features/              # Telas da aplicação (cada uma lazy-loaded)
│   │   ├── achievements/
│   │   ├── auth/
│   │   │   ├── login/          # Tela de login
│   │   │   └── register/       # Tela de registro
│   │   ├── home/
│   │   ├── offline/            # Tela exibida quando o backend está inacessível
│   │   ├── onboarding/
│   │   ├── practice/
│   │   └── profile/
│   │
│   └── shared/                # Componentes reutilizáveis
│       └── components/
│           ├── badge-chip/        # Tag de conquista
│           ├── glass-panel/       # Card com visual de vidro fosco
│           ├── module-card/       # Card de módulo na home
│           ├── piano-keyboard/    # Teclado de piano interativo (C4–C5)
│           ├── piano-tutorial/    # Overlay de mapeamento de teclas
│           ├── primary-button/    # Botão principal da UI
│           └── xp-bar/            # Barra de progresso de XP
│
└── styles.scss                # Tema global, variáveis CSS
```

## Arquitetura do Backend

O backend é uma API REST em **FastAPI**, com persistência via **SQLAlchemy 2.0 (async)** e autenticação **JWT**. O ORM é agnóstico de banco: **SQLite** (`aiosqlite`) em desenvolvimento/testes e **PostgreSQL** (`asyncpg`) em produção, configurado via `DUOMUSIC_DATABASE_URL`.

```
backend/
└── app/
    ├── main.py                 # Composição da aplicação: lifespan, CORS, middlewares, routers
    ├── config.py                # Settings (Pydantic), lidas do .env com prefixo DUOMUSIC_
    ├── database.py              # engine assíncrono, async_session_maker, get_db(), init_db()/close_db()
    ├── auth/                    # Módulo de autenticação
    │   ├── dependencies.py      # get_current_user / get_current_active_user (OAuth2PasswordBearer)
    │   ├── jwt.py                # create_access_token, create_refresh_token, decode_token
    │   ├── password.py           # hash_password / verify_password (bcrypt, truncamento em 72 bytes)
    │   └── schemas.py            # Schemas Pydantic (camelCase na API, snake_case internamente)
    ├── models/                  # Modelos SQLAlchemy (tabelas)
    │   ├── db_user.py            # User
    │   ├── db_refresh_token.py   # RefreshToken
    │   ├── db_user_progress.py   # UserProgress
    │   ├── db_exercise_history.py # ExerciseHistory
    │   ├── module.py / exercise.py / achievement.py  # Modelos Pydantic do conteúdo educacional
    ├── routers/
    │   ├── auth.py               # /api/auth/* — registro, login, refresh, logout, perfil
    │   ├── user_progress.py      # /api/users/me/progress e /api/users/me/history
    │   ├── exercises.py / modules.py / achievements.py  # Conteúdo educacional (somente leitura)
    ├── services/
    │   ├── user_service.py       # CRUD e autenticação de usuários, gestão de refresh tokens
    │   ├── user_progress_service.py # Merge de progresso e histórico de exercícios
    │   ├── exercise_service.py / module_service.py / achievement_service.py
    │   └── llm/                  # Integração opcional com LLM (explicações geradas por IA)
    └── utils/
        └── music.py              # Conversão nota↔frequência
```

### Composição da aplicação (`main.py`)

Os routers são registrados sob o prefixo `/api`, na ordem: `auth`, `user_progress`, `exercises`, `modules`, `achievements`. Um `lifespan` assíncrono chama `init_db()` na subida (cria tabelas — uso apenas em dev/test, produção deve usar Alembic) e `close_db()` no encerramento.

**Middlewares aplicados a todas as requisições:**

- **CORS** — `allow_credentials=True`, métodos `GET/POST/PUT/DELETE/OPTIONS`, headers `Content-Type, Authorization`
- **Rate limiting** — middleware próprio, em memória, chaveado por IP do cliente (`DUOMUSIC_RATE_LIMIT_MAX`, `DUOMUSIC_RATE_LIMIT_WINDOW`)
- **Security headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` bloqueando câmera/microfone/geolocalização

### Fluxo de autenticação

1. **Registro/Login** (`POST /api/auth/register`, `POST /api/auth/login/json`) retornam um par `access_token` (30 min) + `refresh_token` (7 dias)
2. O `access_token` é um JWT (`HS256`) com claims `sub` (user id), `type: "access"`, `jti` (UUID único), `iat`, `exp`
3. O `refresh_token` segue o mesmo formato (`type: "refresh"`) e seu hash é persistido na tabela `refresh_tokens`, permitindo revogação
4. `POST /api/auth/refresh` valida o refresh token, emite um novo par e **revoga o anterior** (rotação)
5. `get_current_active_user` (dependency do FastAPI) decodifica o `access_token` via `Authorization: Bearer`, garantindo `type == "access"` e buscando o usuário no banco
6. Senhas são hasheadas com **bcrypt** (via `passlib`), truncadas em 72 bytes (limite do algoritmo)

No frontend, o `authInterceptor` injeta o `Bearer` token em toda requisição (exceto `/auth/login`, `/auth/register`, `/auth/refresh`) e, ao receber `401`, tenta renovar o token automaticamente via `AuthService.refreshToken()` antes de repetir a requisição.
