# Serviços Principais

## `AudioService` — Motor de áudio

Responsável por toda a síntese de som usando a **Web Audio API** nativa do browser — sem dependências externas.

| Método | O que faz |
|--------|-----------|
| `resume()` | Retoma o `AudioContext` (obrigatório após interação do usuário) |
| `playTone(freq, duration, type?)` | Toca um tom simples (oscilador) |
| `playInterval(rootFreq, semitones, duration)` | Toca dois tons em sequência |
| `playChord(rootFreq, chordType, duration)` | Toca três tons simultâneos |
| `playMelody(notes, onNoteStart?)` | Pré-agenda uma sequência de notas com callback por nota |
| `playMetronomeTick(isAccent)` | Clique de metrônomo (forte no beat 0) |
| `setMasterVolume(value)` | Ajusta o volume geral (0 a 1) |

## `AuthService` — Autenticação

Gerencia o estado de autenticação do usuário usando **Signals**, persiste os tokens no `localStorage` (chave `duomusic_tokens`) e conversa com a API em `/api/auth/*`.

**Estado (`AuthState`, discriminado por `status`):** `idle` → `loading` → `authenticated` | `unauthenticated` | `error`.

**Signals/computed públicos (readonly):**

| Signal | Tipo | Descrição |
|--------|------|-----------|
| `state` | `AuthState` | Estado bruto atual |
| `isAuthenticated` | `boolean` | `true` quando `status === 'authenticated'` |
| `isLoading` | `boolean` | `true` durante login/registro/refresh |
| `currentUser` | `User \| null` | Usuário autenticado, ou `null` |
| `error` | `string \| null` | Mensagem de erro traduzida (401 → "Email ou senha incorretos", 409 → "Este email já está cadastrado") |

**Métodos:**

| Método | O que faz |
|--------|-----------|
| `login(credentials)` | `POST /auth/login/json`, salva tokens, carrega `/auth/me` |
| `register(data)` | `POST /auth/register`, salva tokens, carrega `/auth/me` |
| `logout()` | Revoga o refresh token no backend (best-effort), limpa o estado local e navega para `/auth/login` |
| `refreshToken()` | `POST /auth/refresh` para obter um novo par de tokens; limpa o estado se falhar |
| `getAccessToken()` | Retorna o `accessToken` atual salvo no `localStorage`, ou `null` |

Ao inicializar (constructor), o serviço tenta restaurar a sessão a partir de tokens salvos: busca `/auth/me` e, se o access token estiver expirado, tenta um `refreshToken()` automático antes de deslogar.

Ver [auth.guard.ts](architecture.md#guards-de-rota) para os guards `authGuard`/`guestGuard` e o `authInterceptor` (injeta o `Bearer` token e renova em `401`).

## `ApiService` — Carga inicial de conteúdo

Busca o conteúdo educacional (`modules`, `exercises`, `achievements`) do backend uma única vez, na inicialização da aplicação (via `provideAppInitializer` em `app.config.ts`).

**Signals públicos (readonly):** `modules`, `exercises`, `achievements`, `backendOffline`.

| Método | O que faz |
|--------|-----------|
| `initialize()` | Busca `/modules`, `/exercises` e `/achievements` em paralelo; em caso de falha, define `backendOffline = true` (a aplicação redireciona para `/offline`) |
| `getExercisesForModule(moduleId)` | Filtra os exercícios carregados por módulo |

## `ProgressService` — Progresso do aluno

Gerencia todo o estado de aprendizado usando **Signals do Angular** para reatividade.

**Signals públicos (readonly):**

| Signal | Tipo | Descrição |
|--------|------|-----------|
| `level` | `number` | Nível atual |
| `xp` | `number` | XP total |
| `streak` | `number` | Sequência de dias |
| `xpInCurrentLevel` | `number` | XP acumulado no nível atual |
| `accuracy` | `number` | Percentual de acertos (0–100) |

**Método principal — `recordResult(result)`:**
Chamado após cada exercício. Executa em cadeia:
1. Atualiza XP e nível
2. Atualiza o streak de dias
3. Verifica se o módulo foi completado (desbloqueia o próximo)
4. Verifica conquistas desbloqueadas
5. Atualiza missões diárias
6. Persiste tudo no localStorage

**Fórmula de nível:**

```
nível = Math.floor(xpTotal / 100) + 1
```

## `StorageService` — Persistência local

Abstração segura sobre o `localStorage` com suporte a JSON e valores padrão.

```typescript
get<T>(key: string, defaultValue: T): T   // lê e deserializa
set<T>(key: string, value: T): void       // serializa e salva
remove(key: string): void                 // remove a chave
```

**Chaves utilizadas:**

| Chave | Conteúdo |
|-------|----------|
| `duomusic_progress` | Progresso completo do aluno (`UserProgress`) |
| `duomusic_settings` | Preferências (`AppSettings`) |
| `duomusic_onboarding_done` | Boolean — onboarding concluído |
| `duomusic_tokens` | Tokens de autenticação (`AuthTokens`) |

## `I18nService` — Internacionalização

Serviço de tradução com suporte à interpolação de variáveis:

```typescript
i18n.t('home.level', { n: 3 })        // → "Nível 3"
i18n.t('practice.exercise.of', { n: 1, total: 5 }) // → "Exercício 1 de 5"
```

Ver [i18n.md](i18n.md) para detalhes do dicionário.

## Serviços do backend

Localizados em `backend/app/services/`, encapsulam a lógica de negócio usada pelos routers.

### `UserService` (`user_service.py`)

CRUD e autenticação de usuários:

| Método | O que faz |
|--------|-----------|
| `create_user(data)` | Cria usuário (email normalizado para lowercase), hasheia a senha, define `is_active=True` |
| `get_by_id(id)` / `get_by_email(email)` | Busca usuário (case-insensitive por email) |
| `authenticate(email, password)` | Valida credenciais e atualiza `last_login_at`; retorna `None` se inválido ou usuário inativo |
| `update_user(user, data)` | Atualiza `display_name` |
| `deactivate_user(user)` | Soft delete (`is_active=False`) e revoga todos os refresh tokens |
| `store_refresh_token` / `revoke_refresh_token` | Gerencia o ciclo de vida dos refresh tokens (hash + expiração) |

### `UserProgressService` (`user_progress_service.py`)

Sincronização de progresso entre dispositivos e histórico de exercícios (ver estratégia de merge em [data-models.md](data-models.md#persistência-dupla-localstorage--backend)):

| Método | O que faz |
|--------|-----------|
| `get_progress(user_id)` | Retorna o progresso salvo ou os valores padrão de um usuário novo |
| `sync_progress(user_id, data)` | Aplica o merge (XP/streak: maior valor; módulos/conquistas: união; missões: mais recente) |
| `get_exercise_history(user_id, limit, offset)` | Histórico paginado de exercícios |
| `add_exercise_result(user_id, data)` | Registra um novo resultado de exercício |
