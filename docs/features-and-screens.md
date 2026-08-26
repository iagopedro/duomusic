# Telas e Funcionalidades

## Login (`/auth/login`)

Formulário de autenticação com campos **email** e **senha**. Protegida pelo `guestGuard` (usuários já autenticados são redirecionados para `/home`).

- Validação: email obrigatório e formato válido, senha obrigatória
- Ao submeter, chama `AuthService.login()`; em caso de erro exibe a mensagem (`error` computed do `AuthService`)
- Sucesso → navega para `/home`
- Link para `/auth/register` para quem ainda não tem conta

## Registro (`/auth/register`)

Formulário de criação de conta com campos **email**, **senha**, **confirmação de senha** e **nome de exibição** (opcional). Também protegida pelo `guestGuard`.

- Validação: email válido, senha entre 8 e 128 caracteres, confirmação deve coincidir com a senha, nome de exibição até 50 caracteres
- Ao submeter, chama `AuthService.register()`; em caso de erro (ex.: e-mail duplicado, `409`) exibe a mensagem
- Sucesso → navega para `/onboarding` (novo usuário ainda não passou pela introdução)
- Link para `/auth/login` para quem já possui conta

## Onboarding (`/onboarding`)

Apresentação em 3 passos para novos usuários. Ao concluir, registra `duomusic_onboarding_done = true` e navega para `/home`.

## Home (`/home`)

Tela principal. Exibe: nível e XP, streak, missões diárias, grade de módulos, conquistas recentes.

## Prática (`/practice/:moduleId`)

Tela central do aprendizado. Gerencia um fluxo de fases:

```
intro ──► exercise ──► feedback ──► (próximo exercício ou result)
                  └──► retry (se errar e tentar novamente)
```

| Fase | O que acontece |
|------|---------------|
| `intro` | Apresenta o módulo com contagem de exercícios e XP total |
| `exercise` | Exibe o exercício atual (ritmo / intervalo / acorde / note-id / melodia) |
| `feedback` | Mostra acerto/erro, explicação, XP ganho e score (melodia) |
| `result` | Resumo da sessão (acertos, XP total) |

**Fases internas do exercício de melodia** (gerenciadas por `melodyPhase`):

| Fase interna | Descrição |
|---|---|
| `listen` | Ouvir a melodia, piano desabilitado |
| `explore` | Piano livre para exploração sem avaliação |
| `countdown` | Contagem regressiva (3→2→1→GO!) antes de gravar |
| `recording` | Janela de gravação ativa com timer automático |

## Conquistas (`/achievements`)

Lista todas as conquistas com status visual (conquistado em destaque, bloqueadas em cinza).

## Perfil (`/profile`)

Estatísticas do aluno + configurações (volume, tema, animações).
