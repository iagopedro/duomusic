# Test Matrix: Autenticação DuoMusic

Este documento lista todos os casos de teste planejados para o sistema de autenticação.
Use como checklist durante a implementação.

---

## Backend — Python (pytest)

### 1. Password Hashing (`test_auth_password.py`)

| # | Caso de Teste | Status |
|---|---------------|--------|
| 1.1 | `hash_password` retorna string diferente do input | ⬜ |
| 1.2 | `hash_password` gera hashes diferentes para mesma senha (salt) | ⬜ |
| 1.3 | `verify_password` retorna True para senha correta | ⬜ |
| 1.4 | `verify_password` retorna False para senha incorreta | ⬜ |
| 1.5 | `hash_password` funciona com caracteres especiais (!@#$%^&*) | ⬜ |
| 1.6 | `hash_password` funciona com caracteres unicode (émojis, acentos) | ⬜ |
| 1.7 | `hash_password` funciona com senha longa (128 chars) | ⬜ |

### 2. JWT Tokens (`test_auth_jwt.py`)

| # | Caso de Teste | Status |
|---|---------------|--------|
| 2.1 | `create_access_token` retorna string JWT válida (3 partes separadas por .) | ⬜ |
| 2.2 | `create_access_token` inclui user_id no campo `sub` | ⬜ |
| 2.3 | `create_access_token` inclui campo `exp` (expiração) | ⬜ |
| 2.4 | `create_access_token` inclui campo `iat` (issued at) | ⬜ |
| 2.5 | `create_refresh_token` tem expiração maior que access token | ⬜ |
| 2.6 | `decode_token` retorna payload para token válido | ⬜ |
| 2.7 | `decode_token` levanta erro para token expirado | ⬜ |
| 2.8 | `decode_token` levanta erro para token malformado | ⬜ |
| 2.9 | `decode_token` levanta erro para assinatura inválida | ⬜ |
| 2.10 | `decode_token` levanta erro para algoritmo diferente | ⬜ |

### 3. User Service (`test_user_service.py`)

#### Criação de Usuário
| # | Caso de Teste | Status |
|---|---------------|--------|
| 3.1 | `create_user` salva usuário no banco | ⬜ |
| 3.2 | `create_user` retorna user sem campo password | ⬜ |
| 3.3 | `create_user` gera UUID automaticamente | ⬜ |
| 3.4 | `create_user` levanta erro para email duplicado | ⬜ |
| 3.5 | `create_user` normaliza email para lowercase | ⬜ |
| 3.6 | `create_user` define `created_at` automaticamente | ⬜ |
| 3.7 | `create_user` define `is_active` como True | ⬜ |
| 3.8 | `create_user` aceita `display_name` opcional | ⬜ |

#### Busca de Usuário
| # | Caso de Teste | Status |
|---|---------------|--------|
| 3.9 | `get_by_id` retorna user existente | ⬜ |
| 3.10 | `get_by_id` retorna None para id inexistente | ⬜ |
| 3.11 | `get_by_email` retorna user existente | ⬜ |
| 3.12 | `get_by_email` retorna None para email inexistente | ⬜ |
| 3.13 | `get_by_email` busca case-insensitive | ⬜ |

#### Autenticação
| # | Caso de Teste | Status |
|---|---------------|--------|
| 3.14 | `authenticate` retorna user para credenciais válidas | ⬜ |
| 3.15 | `authenticate` retorna None para email inexistente | ⬜ |
| 3.16 | `authenticate` retorna None para senha incorreta | ⬜ |
| 3.17 | `authenticate` atualiza `last_login_at` | ⬜ |
| 3.18 | `authenticate` retorna None para user inativo | ⬜ |

#### Atualização
| # | Caso de Teste | Status |
|---|---------------|--------|
| 3.19 | `update_user` altera `display_name` | ⬜ |
| 3.20 | `update_user` atualiza `updated_at` | ⬜ |
| 3.21 | `deactivate_user` marca `is_active` como False | ⬜ |

### 4. Auth Router (`test_auth_routers.py`)

#### POST /auth/register
| # | Caso de Teste | Status |
|---|---------------|--------|
| 4.1 | Retorna 201 para dados válidos | ⬜ |
| 4.2 | Retorna `access_token` e `refresh_token` | ⬜ |
| 4.3 | Cria user no banco | ⬜ |
| 4.4 | Retorna 422 para email inválido | ⬜ |
| 4.5 | Retorna 422 para senha menor que 8 chars | ⬜ |
| 4.6 | Retorna 409 para email duplicado | ⬜ |
| 4.7 | Retorna 422 para campos obrigatórios faltando | ⬜ |
| 4.8 | Retorna 422 para senha maior que 128 chars | ⬜ |
| 4.9 | `display_name` é opcional | ⬜ |

#### POST /auth/login
| # | Caso de Teste | Status |
|---|---------------|--------|
| 4.10 | Retorna 200 para credenciais válidas | ⬜ |
| 4.11 | Retorna `access_token` e `refresh_token` | ⬜ |
| 4.12 | Retorna 401 para email inexistente | ⬜ |
| 4.13 | Retorna 401 para senha incorreta | ⬜ |
| 4.14 | Retorna 401 para user inativo | ⬜ |
| 4.15 | Atualiza `last_login_at` no banco | ⬜ |
| 4.16 | Rate limit funciona (bloqueia após N tentativas) | ⬜ |

#### POST /auth/refresh
| # | Caso de Teste | Status |
|---|---------------|--------|
| 4.17 | Retorna novo `access_token` para refresh válido | ⬜ |
| 4.18 | Retorna 401 para refresh token expirado | ⬜ |
| 4.19 | Retorna 401 para refresh token revogado | ⬜ |
| 4.20 | Retorna 401 para refresh token inválido | ⬜ |
| 4.21 | Rotaciona refresh token (opcional) | ⬜ |

#### POST /auth/logout
| # | Caso de Teste | Status |
|---|---------------|--------|
| 4.22 | Revoga refresh token no banco | ⬜ |
| 4.23 | Retorna 204 No Content | ⬜ |
| 4.24 | Requer autenticação (401 sem token) | ⬜ |

#### GET /auth/me
| # | Caso de Teste | Status |
|---|---------------|--------|
| 4.25 | Retorna dados do usuário logado | ⬜ |
| 4.26 | Retorna 401 sem token | ⬜ |
| 4.27 | Retorna 401 com token expirado | ⬜ |
| 4.28 | Não retorna `hashed_password` | ⬜ |

#### PUT /auth/me
| # | Caso de Teste | Status |
|---|---------------|--------|
| 4.29 | Atualiza `display_name` | ⬜ |
| 4.30 | Retorna 422 para `display_name` maior que 50 chars | ⬜ |
| 4.31 | Requer autenticação | ⬜ |

#### DELETE /auth/me
| # | Caso de Teste | Status |
|---|---------------|--------|
| 4.32 | Desativa conta (soft delete) | ⬜ |
| 4.33 | Retorna 204 No Content | ⬜ |
| 4.34 | Requer autenticação | ⬜ |
| 4.35 | Revoga todos os refresh tokens do user | ⬜ |

### 5. Progress Sync (`test_progress_sync.py`)

| # | Caso de Teste | Status |
|---|---------------|--------|
| 5.1 | `GET /users/me/progress` retorna progresso do user | ⬜ |
| 5.2 | `GET /users/me/progress` retorna default para novo user | ⬜ |
| 5.3 | `PUT /users/me/progress` atualiza progresso | ⬜ |
| 5.4 | `PUT /users/me/progress` faz merge (maior XP vence) | ⬜ |
| 5.5 | `GET /users/me/history` retorna histórico paginado | ⬜ |
| 5.6 | `GET /users/me/history` suporta filtro por data | ⬜ |
| 5.7 | `POST /users/me/history` adiciona resultado de exercício | ⬜ |

### 6. Database (`test_database.py`)

| # | Caso de Teste | Status |
|---|---------------|--------|
| 6.1 | Conexão com SQLite funciona | ⬜ |
| 6.2 | Sessão é fechada após request | ⬜ |
| 6.3 | Rollback em caso de erro | ⬜ |
| 6.4 | Foreign key constraint funciona | ⬜ |

---

## Frontend — TypeScript (Vitest)

### 7. AuthService (`auth.service.spec.ts`)

#### login()
| # | Caso de Teste | Status |
|---|---------------|--------|
| 7.1 | Atualiza state para `authenticated` em caso de sucesso | ⬜ |
| 7.2 | Salva tokens no storage | ⬜ |
| 7.3 | Atualiza state para `error` em caso de falha | ⬜ |
| 7.4 | Limpa tokens antigos antes de salvar novos | ⬜ |
| 7.5 | State fica `loading` durante requisição | ⬜ |

#### register()
| # | Caso de Teste | Status |
|---|---------------|--------|
| 7.6 | Cria conta e faz login automaticamente | ⬜ |
| 7.7 | Propaga erro de email duplicado | ⬜ |
| 7.8 | State fica `loading` durante requisição | ⬜ |

#### logout()
| # | Caso de Teste | Status |
|---|---------------|--------|
| 7.9 | Remove tokens do storage | ⬜ |
| 7.10 | Atualiza state para `unauthenticated` | ⬜ |
| 7.11 | Chama endpoint de logout no backend | ⬜ |
| 7.12 | Redireciona para `/auth/login` | ⬜ |

#### refreshToken()
| # | Caso de Teste | Status |
|---|---------------|--------|
| 7.13 | Atualiza access token quando refresh é válido | ⬜ |
| 7.14 | Faz logout quando refresh é inválido | ⬜ |
| 7.15 | Retorna false quando não há refresh token | ⬜ |

#### initializeAuth()
| # | Caso de Teste | Status |
|---|---------------|--------|
| 7.16 | Restaura sessão de tokens salvos | ⬜ |
| 7.17 | Define `unauthenticated` se não há tokens | ⬜ |
| 7.18 | Faz refresh se access token está expirado | ⬜ |

#### Computed Signals
| # | Caso de Teste | Status |
|---|---------------|--------|
| 7.19 | `isAuthenticated` retorna true quando autenticado | ⬜ |
| 7.20 | `currentUser` retorna user quando autenticado | ⬜ |
| 7.21 | `currentUser` retorna null quando não autenticado | ⬜ |

### 8. AuthInterceptor (`auth.interceptor.spec.ts`)

| # | Caso de Teste | Status |
|---|---------------|--------|
| 8.1 | Não adiciona header em rotas públicas | ⬜ |
| 8.2 | Adiciona Bearer token em rotas protegidas | ⬜ |
| 8.3 | Tenta refresh quando recebe 401 | ⬜ |
| 8.4 | Faz logout quando refresh falha | ⬜ |
| 8.5 | Reenvia request original após refresh bem-sucedido | ⬜ |

### 9. Auth Guards (`auth.guard.spec.ts`)

| # | Caso de Teste | Status |
|---|---------------|--------|
| 9.1 | `authGuard` permite acesso quando autenticado | ⬜ |
| 9.2 | `authGuard` redireciona para login quando não autenticado | ⬜ |
| 9.3 | `guestGuard` permite acesso quando não autenticado | ⬜ |
| 9.4 | `guestGuard` redireciona para home quando autenticado | ⬜ |

### 10. LoginComponent (`login.component.spec.ts`)

#### Formulário
| # | Caso de Teste | Status |
|---|---------------|--------|
| 10.1 | Desabilita submit quando form é inválido | ⬜ |
| 10.2 | Mostra erro para email inválido | ⬜ |
| 10.3 | Mostra erro para senha vazia | ⬜ |
| 10.4 | Habilita submit quando form é válido | ⬜ |

#### Submit
| # | Caso de Teste | Status |
|---|---------------|--------|
| 10.5 | Chama `authService.login` com credenciais | ⬜ |
| 10.6 | Mostra loading durante requisição | ⬜ |
| 10.7 | Mostra mensagem de erro em caso de falha | ⬜ |
| 10.8 | Redireciona para home em caso de sucesso | ⬜ |

#### Navegação
| # | Caso de Teste | Status |
|---|---------------|--------|
| 10.9 | Tem link para página de registro | ⬜ |

### 11. RegisterComponent (`register.component.spec.ts`)

#### Formulário
| # | Caso de Teste | Status |
|---|---------------|--------|
| 11.1 | Valida email obrigatório | ⬜ |
| 11.2 | Valida formato de email | ⬜ |
| 11.3 | Valida senha mínima de 8 caracteres | ⬜ |
| 11.4 | Valida confirmação de senha | ⬜ |
| 11.5 | `display_name` é opcional | ⬜ |

#### Submit
| # | Caso de Teste | Status |
|---|---------------|--------|
| 11.6 | Chama `authService.register` com dados | ⬜ |
| 11.7 | Mostra erro de email duplicado | ⬜ |
| 11.8 | Redireciona para onboarding em caso de sucesso | ⬜ |

### 12. SyncService (`sync.service.spec.ts`)

| # | Caso de Teste | Status |
|---|---------------|--------|
| 12.1 | Sincroniza progresso quando online | ⬜ |
| 12.2 | Armazena localmente quando offline | ⬜ |
| 12.3 | Sincroniza pendentes ao reconectar | ⬜ |
| 12.4 | Merge favorece maior XP | ⬜ |
| 12.5 | Merge preserva achievements de ambos os lados | ⬜ |

---

## Resumo

| Categoria | Total de Testes |
|-----------|-----------------|
| Password Hashing | 7 |
| JWT Tokens | 10 |
| User Service | 21 |
| Auth Router | 35 |
| Progress Sync | 7 |
| Database | 4 |
| AuthService (FE) | 21 |
| AuthInterceptor (FE) | 5 |
| Auth Guards (FE) | 4 |
| LoginComponent (FE) | 9 |
| RegisterComponent (FE) | 8 |
| SyncService (FE) | 5 |
| **TOTAL** | **136** |
