# Testes Unitários

# Testes Unitários

O DuoMusic possui **368 testes unitários no frontend** (27 arquivos, Vitest 4.1) e **219 testes no backend** (pytest), cobrindo o fluxo completo do usuário — incluindo autenticação.

## Frontend (Vitest)

### Executar os testes

```bash
npm test                  # executa uma vez
npm run test:coverage     # executa com relatório de cobertura
npm test -- --include="src/app/core/auth/**"   # filtra por glob (não usar `--run <file>`)
```

### Cobertura

| Arquivo de spec | Testes | O que cobre |
|-----------------|--------|-------------|
| `app.spec.ts` | 6 | Criação da aplicação, roteamento |
| `auth.guard.spec.ts` | 6 | `authGuard`/`guestGuard` — redirecionamento conforme estado de autenticação |
| `auth.interceptor.spec.ts` | 10 | Injeção do Bearer token, renovação automática em `401`, URLs públicas |
| `auth.service.spec.ts` | 19 | Login, registro, logout, refresh, restauração de sessão, tratamento de erros |
| `onboarding.guard.spec.ts` | 4 | Redirecionamento de rotas |
| `i18n.service.spec.ts` | 9 | Tradução, interpolação, fallback |
| `api.service.spec.ts` | 6 | Carga inicial de módulos/exercícios/conquistas, `backendOffline` |
| `audio.service.spec.ts` | 16 | Síntese de som, volume, metrônomo |
| `background-track.service.spec.ts` | 16 | Trilha sonora de fundo |
| `progress.service.spec.ts` | 19 | XP, nível, streak, conquistas, módulos |
| `settings.service.spec.ts` | 12 | Persistência e alteração de preferências |
| `storage.service.spec.ts` | 10 | Leitura, escrita e remoção no localStorage |
| `achievements.component.spec.ts` | 8 | Lista de conquistas |
| `login.component.spec.ts` | 22 | Validação de formulário, submit, navegação, mensagens de erro |
| `register.component.spec.ts` | 30 | Validação de formulário, confirmação de senha, submit, navegação, mensagens de erro |
| `home.component.spec.ts` | 10 | Tela principal |
| `offline.component.spec.ts` | 6 | Tela de modo offline |
| `onboarding.component.spec.ts` | 12 | Fluxo de introdução |
| `practice.component.spec.ts` | 70 | Fluxo completo de prática, exploração livre, gravação e scoring de melodia |
| `profile.component.spec.ts` | 13 | Estatísticas e configurações do usuário |
| `badge-chip.component.spec.ts` | 7 | Tags de conquista |
| `glass-panel.component.spec.ts` | 6 | Projeção de conteúdo |
| `module-card.component.spec.ts` | 12 | Card de módulo, bloqueio, clique |
| `piano-keyboard.component.spec.ts` | 14 | Teclado interativo |
| `piano-tutorial.component.spec.ts` | 10 | Overlay de mapeamento de teclas |
| `primary-button.component.spec.ts` | 10 | Variantes, estados, evento de clique |
| `xp-bar.component.spec.ts` | 5 | Barra de progresso visual |

### Convenções importantes

O projeto é **zoneless** (sem `zone.js`) — `fakeAsync`/`tick` **não funcionam** aqui. Testes assíncronos (ex.: `AuthService`, `authInterceptor`) usam `async/await` com um helper `flushPromises()`:

```typescript
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
await flushPromises();
```

**Componentes OnPush** exigem `setInput()` para alterar entradas em testes:

```typescript
fixture.componentRef.setInput('label', 'novo valor');
fixture.detectChanges();
```

**Mock de construtores de classe** (Vitest v4) exige `function` keyword:

```typescript
(window as any).AudioContext = vi.fn().mockImplementation(function() {
  return mockCtx;
});
```

## Backend (pytest)

### Executar os testes

```bash
cd backend
.venv\Scripts\activate       # Windows — ou `source .venv/bin/activate` no Linux/macOS
pytest                       # executa toda a suíte
pytest --collect-only -q     # lista os testes sem executá-los
pytest tests/test_auth_routers.py  # executa apenas um arquivo
```

### Cobertura

| Arquivo de teste | Testes | O que cobre |
|-------------------|--------|-------------|
| `test_auth_password.py` | 9 | Hash e verificação de senha (bcrypt, truncamento, unicode) |
| `test_auth_jwt.py` | 14 | Criação/decodificação de tokens, expiração, assinatura inválida |
| `test_auth_user_service.py` | 25 | CRUD de usuários, autenticação, refresh tokens |
| `test_auth_routers.py` | 29 | Endpoints `/auth/*` (registro, login, refresh, logout, perfil) |
| `test_config.py` | 7 | Carregamento de configurações (`Settings`) |
| `test_models.py` | 27 | Modelos Pydantic do conteúdo educacional |
| `test_prompts.py` | 14 | Templates de prompt do módulo LLM |
| `test_routers.py` | 39 | Endpoints de módulos, exercícios e conquistas |
| `test_services.py` | 30 | Serviços de módulos, exercícios e conquistas |
| `test_utils_music.py` | 25 | Conversão nota↔frequência |

Os testes de autenticação usam um banco **SQLite em memória** isolado por teste (fixture em `conftest.py`), garantindo que nenhum teste dependa de estado compartilhado.
