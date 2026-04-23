# Telas e Funcionalidades

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
