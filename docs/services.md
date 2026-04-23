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

## `I18nService` — Internacionalização

Serviço de tradução com suporte à interpolação de variáveis:

```typescript
i18n.t('home.level', { n: 3 })        // → "Nível 3"
i18n.t('practice.exercise.of', { n: 1, total: 5 }) // → "Exercício 1 de 5"
```

Ver [i18n.md](i18n.md) para detalhes do dicionário.
