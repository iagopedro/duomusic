# DuoMusic — Documentação Técnica e Didática

> Plataforma interativa de teoria musical para estudantes iniciantes, construída com Angular 21 e Web Audio API.

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Conceitos Musicais Abordados](#2-conceitos-musicais-abordados)
3. [Arquitetura da Aplicação](#3-arquitetura-da-aplicação)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Modelos de Dados](#5-modelos-de-dados)
6. [Módulos de Aprendizado](#6-módulos-de-aprendizado)
7. [Tipos de Exercício](#7-tipos-de-exercício)
8. [Serviços Principais](#8-serviços-principais)
9. [Telas e Funcionalidades](#9-telas-e-funcionalidades)
10. [Sistema de Progresso e Gamificação](#10-sistema-de-progresso-e-gamificação)
11. [Internacionalização (i18n)](#11-internacionalização-i18n)
12. [Testes Unitários](#12-testes-unitários)
13. [Como Executar o Projeto](#13-como-executar-o-projeto)
14. [Guia para Adicionar Novas Features](#14-guia-para-adicionar-novas-features)

---

## 1. Visão Geral do Projeto

O **DuoMusic** é uma aplicação web educacional que ensina teoria musical de forma **interativa, visual e gamificada**, inspirada em plataformas como Duolingo. O objetivo é tornar o aprendizado de música acessível para iniciantes, sem exigir conhecimento prévio de leitura de partituras.

### Pilares pedagógicos

| Pilar | Como o DuoMusic aplica |
|-------|----------------------|
| **Aprendizado ativo** | O estudante ouve e responde — não apenas lê |
| **Feedback imediato** | Cada exercício mostra se o acerto foi correto e explica o porquê |
| **Progressão gradual** | Módulos desbloqueados conforme o aluno evolui |
| **Motivação contínua** | XP, níveis, conquistas e missões diárias mantêm o engajamento |

### Tecnologias utilizadas

| Tecnologia | Versão | Papel |
|-----------|--------|-------|
| Angular | 21.2.x | Framework principal (SPA) |
| Angular Material | 21.x | Componentes de UI (ícones) |
| Web Audio API | nativa do browser | Síntese de som em tempo real |
| Vitest | 4.1.x | Test runner para testes unitários |
| TypeScript | 5.x | Tipagem estática |
| SCSS | — | Estilização com variáveis e BEM |

---

## 2. Conceitos Musicais Abordados

Para compreender o projeto, é útil entender os conceitos musicais que ele ensina:

### Ritmo
O **ritmo** é a organização do som no tempo. Os tipos de notas usados no DuoMusic são:

| Símbolo | Nome | Duração relativa |
|---------|------|-----------------|
| ♩ | Semínima (quarter note) | 1 tempo completo |
| ♪ | Colcheia (eighth note) | ½ tempo |
| 𝄽 | Pausa (rest) | Silêncio por 1 tempo |

O **BPM** (Batidas Por Minuto) define a velocidade: 80 BPM = 1 batida a cada 750ms.

### Intervalos
Um **intervalo** é a distância entre duas notas, medida em **semitons**. Cada semitom equivale a uma tecla no piano.

| Semitons | Nome | Exemplo |
|----------|------|---------|
| 3 | 3ª menor | Dó → Mi♭ |
| 4 | 3ª maior | Dó → Mi |
| 5 | 4ª justa | Dó → Fá |
| 7 | 5ª justa | Dó → Sol |
| 12 | Oitava | Dó → Dó (acima) |

### Acordes
Um **acorde** é a combinação de 3 ou mais notas tocadas simultaneamente. O DuoMusic trabalha com 4 qualidades:

| Tipo | Semitons (a partir da raiz) | Som |
|------|---------------------------|-----|
| Maior (major) | 0 + 4 + 7 | Alegre, brilhante |
| Menor (minor) | 0 + 3 + 7 | Melancólico, suave |
| Diminuto (dim) | 0 + 3 + 6 | Tenso, instável |
| Aumentado (aug) | 0 + 4 + 8 | Suspenso, intrigante |

---

## 3. Arquitetura da Aplicação

O DuoMusic é uma **Single Page Application (SPA)** com roteamento lazy-loaded. Cada feature é um módulo independente carregado apenas quando necessário.

```
Browser
  └── Angular App (standalone, sem NgModules tradicionais)
        ├── Router (lazy loading por feature)
        ├── Core (serviços singleton injetados globalmente)
        ├── Features (telas da aplicação)
        └── Shared (componentes reutilizáveis)
```

### Fluxo de navegação

```
/ (raiz)
  └── /onboarding  ← primeira visita (guard: onboardingGuard)
  └── /home        ← tela principal  (guard: requireOnboardingGuard)
  └── /practice/:moduleId  ← sessão de prática
  └── /achievements        ← conquistas
  └── /profile             ← perfil e configurações
```

### Guards de rota

Dois guards controlam o acesso:

- **`onboardingGuard`** — redireciona para `/home` se o onboarding já foi concluído (evita repetição)
- **`requireOnboardingGuard`** — redireciona para `/onboarding` se o usuário ainda não completou a introdução

---

## 4. Estrutura de Pastas

```
src/
├── app/
│   ├── app.config.ts          # Bootstrap da aplicação (providers globais)
│   ├── app.routes.ts          # Definição de todas as rotas
│   ├── app.ts                 # Componente raiz
│   │
│   ├── core/                  # Camada de infraestrutura (serviços, modelos, guards)
│   │   ├── guards/
│   │   │   └── onboarding.guard.ts
│   │   ├── i18n/
│   │   │   ├── i18n.service.ts    # Serviço de tradução
│   │   │   └── pt-br.ts           # Dicionário em português
│   │   ├── models/
│   │   │   └── index.ts           # Todas as interfaces TypeScript
│   │   ├── services/
│   │   │   ├── audio.service.ts   # Síntese de áudio (Web Audio API)
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
│   │   ├── home/
│   │   ├── onboarding/
│   │   ├── practice/
│   │   └── profile/
│   │
│   └── shared/                # Componentes reutilizáveis
│       └── components/
│           ├── badge-chip/        # Tag de conquista
│           ├── glass-panel/       # Card com visual de vidro fosco
│           ├── module-card/       # Card de módulo na home
│           ├── primary-button/    # Botão principal da UI
│           └── xp-bar/            # Barra de progresso de XP
│
└── styles.scss                # Tema global, variáveis CSS
```

---

## 5. Modelos de Dados

Os modelos são definidos em `src/app/core/models/index.ts` e representam todas as entidades do domínio educacional.

### `Module` — Módulo de aprendizado
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

### `Exercise` — Exercício educacional

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

### `UserProgress` — Progresso do aluno
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

Todo o progresso é **persistido no `localStorage`** via `StorageService`, garantindo que o aluno não perca seu histórico ao fechar o browser.

---

## 6. Módulos de Aprendizado

Os módulos seguem uma progressão pedagógica cuidadosamente ordenada:

```
[Fundamentos] ──► [Intervalos] ──► [Escalas] ──► [Acordes] ──► [Treino Misto]
   0 XP             50 XP           150 XP         300 XP         500 XP
```

| Módulo | ID | XP mínimo | Exercícios | Foco pedagógico |
|--------|----|-----------|-----------|-----------------|
| Fundamentos | `fundamentals` | 0 | r-1, r-2, r-3 | Percepção rítmica |
| Intervalos | `intervals` | 50 | i-1 a i-4 | Ouvido harmônico básico |
| Escalas | `scales` | 150 | i-5, i-6 | Intervalos mais complexos |
| Acordes | `chords` | 300 | c-1, c-2, c-3 | Qualidade dos acordes |
| Treino misto | `mixed` | 500 | misto | Revisão geral |

**Regra de desbloqueio**: um módulo abre automaticamente quando o módulo anterior é completado (todos os exercícios com acerto) **e** o aluno possui o XP mínimo exigido.

---

## 7. Tipos de Exercício

### 7.1 Exercício de Ritmo (`RhythmExercise`)

O aluno ouve um padrão rítmico gerado pelo metrônomo e deve reproduzi-lo tocando um botão no tempo certo.

```typescript
interface RhythmExercise extends BaseExercise {
  type: 'rhythm';
  bpm: number;                              // velocidade em batidas por minuto
  pattern: ('quarter' | 'eighth' | 'rest')[]; // padrão de notas
  toleranceMs: number;                      // margem de erro aceita em ms
}
```

**Fluxo do exercício:**
1. Aluno clica em "Iniciar ritmo"
2. Contagem regressiva **3 → 2 → 1 → GO!** (cada número dura exatamente `msBeat`)
3. O metrônomo toca o padrão com destaque visual em cada batida
4. Aluno toca o botão "Toque aqui!" em cada batida não-pausa
5. O sistema verifica se cada toque está dentro da tolerância definida
6. Acerto: ≥ 60% das batidas não-pausa tocadas dentro da tolerância

**Cálculo do tempo de batida:**
```typescript
msBeat = (60 / bpm) * 1000  // ex: 80 BPM → 750ms por batida
```

**Duração de cada nota:**
```
'eighth' → msBeat / 2   // colcheia dura meio tempo
'quarter' | 'rest' → msBeat  // semínima/pausa dura um tempo inteiro
```

### 7.2 Exercício de Intervalo (`IntervalExercise`)

O aluno ouve dois sons em sequência e deve identificar o intervalo entre eles.

```typescript
interface IntervalExercise extends BaseExercise {
  type: 'interval';
  rootFreq: number;   // frequência da nota raiz em Hz
  semitones: number;  // distância em semitons (resposta correta)
  options: number[];  // opções de resposta apresentadas ao aluno
}
```

A frequência do segundo tom é calculada como:
```
freq2 = rootFreq × 2^(semitones/12)
```

Isso segue o **temperamento igual**, o sistema de afinação padrão da música ocidental.

**Exemplo — exercício `i-1`:**
- Raiz: Dó4 (~261.63 Hz), Semitons: 4 → Mi4
- Opções: 3ª menor, **3ª maior**, 4ª justa, 5ª justa

### 7.3 Exercício de Acorde (`ChordExercise`)

O aluno ouve três notas tocadas simultaneamente e deve identificar a qualidade do acorde.

**Estrutura dos acordes:**

| Tipo | Intervalos gerados |
|------|-------------------|
| major | 0, +4, +7 semitons |
| minor | 0, +3, +7 semitons |
| dim | 0, +3, +6 semitons |
| aug | 0, +4, +8 semitons |

---

## 8. Serviços Principais

### 8.1 `AudioService` — Motor de áudio

Responsável por toda a síntese de som usando a **Web Audio API** nativa do browser — sem dependências externas.

| Método | O que faz |
|--------|-----------|
| `resume()` | Retoma o `AudioContext` (obrigatório após interação do usuário) |
| `playTone(freq, duration, type?)` | Toca um tom simples (oscilador) |
| `playInterval(rootFreq, semitones, duration)` | Toca dois tons em sequência |
| `playChord(rootFreq, chordType, duration)` | Toca três tons simultâneos |
| `playMetronomeTick(isAccent)` | Clique de metrônomo (forte no beat 0) |
| `setMasterVolume(value)` | Ajusta o volume geral (0 a 1) |

### 8.2 `ProgressService` — Progresso do aluno

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

### 8.3 `StorageService` — Persistência local

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

### 8.4 `I18nService` — Internacionalização

Serviço de tradução com suporte à interpolação de variáveis:

```typescript
i18n.t('home.level', { n: 3 })        // → "Nível 3"
i18n.t('practice.exercise.of', { n: 1, total: 5 }) // → "Exercício 1 de 5"
```

---

## 9. Telas e Funcionalidades

### 9.1 Onboarding (`/onboarding`)
Apresentação em 3 passos para novos usuários. Ao concluir, registra `duomusic_onboarding_done = true` e navega para `/home`.

### 9.2 Home (`/home`)
Tela principal. Exibe: nível e XP, streak, missões diárias, grade de módulos, conquistas recentes.

### 9.3 Prática (`/practice/:moduleId`)
Tela central do aprendizado. Gerencia um fluxo de fases:

```
intro ──► exercise ──► feedback ──► (próximo exercício ou result)
                  └──► retry (se errar e tentar novamente)
```

| Fase | O que acontece |
|------|---------------|
| `intro` | Apresenta o módulo com contagem de exercícios e XP total |
| `exercise` | Exibe o exercício atual (ritmo / intervalo / acorde) |
| `feedback` | Mostra acerto/erro, explicação e XP ganho |
| `result` | Resumo da sessão (acertos, XP total) |

### 9.4 Conquistas (`/achievements`)
Lista todas as conquistas com status visual (conquistado em destaque, bloqueadas em cinza).

### 9.5 Perfil (`/profile`)
Estatísticas do aluno + configurações (volume, tema, animações).

---

## 10. Sistema de Progresso e Gamificação

### XP e Níveis

| Ação | XP ganho |
|------|----------|
| Exercício de ritmo/intervalo (fácil) | 10–15 XP |
| Exercício de intervalo/acorde (médio) | 20 XP |
| Exercício difícil | 25 XP |
| Missão diária — 5 exercícios | 30 XP |
| Missão diária — manter streak | 20 XP |

> Exercícios errados ganham **0 XP**.

### Streak (Sequência)
Aumenta +1 a cada dia com pelo menos 1 exercício. Se o aluno pular um dia, o streak é **zerado**. A verificação ocorre ao abrir o app.

### Conquistas

| ID | Ícone | Condição |
|----|-------|----------|
| `first-exercise` | 🎵 | 1 exercício feito |
| `ten-exercises` | 🎶 | 10 exercícios feitos |
| `xp-100` | ⭐ | 100 XP acumulados |
| `xp-500` | 🌟 | 500 XP acumulados |
| `streak-3` | 🔥 | 3 dias seguidos |
| `streak-7` | 🚀 | 7 dias seguidos |
| `fundamentals-done` | 🎸 | Módulo Fundamentos concluído |
| `intervals-done` | 👂 | Módulo Intervalos concluído |
| `accuracy-80` | 🎯 | Precisão ≥ 80% |

---

## 11. Internacionalização (i18n)

O dicionário completo em pt-BR está em `src/app/core/i18n/pt-br.ts`. O sistema usa chaves hierárquicas no padrão `dominio.subdominio.chave`.

**Padrão de interpolação:** `{variavel}` dentro da string.

**Para adicionar uma nova string:**
1. Adicione a chave e o valor em `pt-br.ts`
2. O TypeScript inferirá automaticamente o tipo `I18nKey`, garantindo tipagem segura em todo o projeto

---

## 12. Testes Unitários

O DuoMusic possui **159 testes unitários** distribuídos em 13 arquivos, executando com **Vitest 4.1**.

### Executar os testes

```bash
npm test                  # executa uma vez
npm run test:coverage     # executa com relatório de cobertura
```

### Cobertura

| Arquivo de spec | Testes | O que cobre |
|-----------------|--------|-------------|
| `app.spec.ts` | 6 | Criação da aplicação, roteamento |
| `audio.service.spec.ts` | 14 | Síntese de som, volume, metrônomo |
| `progress.service.spec.ts` | 19 | XP, nível, streak, conquistas, módulos |
| `settings.service.spec.ts` | 12 | Persistência e alteração de preferências |
| `storage.service.spec.ts` | 10 | Leitura, escrita e remoção no localStorage |
| `onboarding.guard.spec.ts` | 4 | Redirecionamento de rotas |
| `i18n.service.spec.ts` | 9 | Tradução, interpolação, fallback |
| `xp-bar.component.spec.ts` | 5 | Barra de progresso visual |
| `primary-button.component.spec.ts` | 10 | Variantes, estados, evento de clique |
| `badge-chip.component.spec.ts` | 7 | Tags de conquista |
| `glass-panel.component.spec.ts` | 6 | Projeção de conteúdo |
| `module-card.component.spec.ts` | 12 | Card de módulo, bloqueio, clique |
| `practice.component.spec.ts` | 45 | Fluxo completo de prática |

### Convenções importantes

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

---

## 13. Como Executar o Projeto

### Pré-requisitos
- Node.js 20+
- npm 10+

### Instalação e execução
```bash
git clone https://github.com/iagopedro/duomusic.git
cd duomusic
npm install
npm start         # http://localhost:4200
```

```bash
npm test              # testes unitários
npm run test:coverage # cobertura
npm run build         # build de produção → dist/duomusic/
```

---

## 14. Guia para Adicionar Novas Features

### Novo exercício

1. Defina o exercício em `src/app/data/exercises.data.ts`
2. Registre o ID no módulo em `src/app/data/modules.data.ts`
3. Adicione strings i18n se necessário em `src/app/core/i18n/pt-br.ts`
4. Atualize o spec do `PracticeComponent`

### Novo módulo

1. Adicione o tipo em `ModuleId` em `src/app/core/models/index.ts`
2. Registre o módulo em `src/app/data/modules.data.ts` com `requiredModuleId` e `minXpToUnlock`
3. Adicione a chave de nome em `pt-br.ts`

### Nova conquista

Em `src/app/data/achievements.data.ts`:
```typescript
{
  id: 'streak-30',
  icon: '👑',
  titleKey: 'Um mês praticando',
  descriptionKey: 'Pratique 30 dias seguidos.',
  condition: { type: 'streak', value: 30 },
}
```
O `ProgressService` verificará automaticamente essa condição após cada exercício.

### Nova tela

1. Crie a pasta em `src/app/features/nome-da-tela/`
2. Gere o componente, rotas e arquivo de spec
3. Registre a rota em `src/app/app.routes.ts` com lazy loading:
```typescript
{
  path: 'nome-da-tela',
  canActivate: [requireOnboardingGuard],
  loadChildren: () =>
    import('./features/nome-da-tela/nome-da-tela.routes').then(m => m.ROUTES),
}
```

---

*Documentação gerada em março de 2026 — DuoMusic v1.0 MVP*

## Purpose

- Ear training: intervals, chord qualities, rhythmic patterns
- Immediate feedback with explanations + retry
- Gamification: XP, levels, streak, daily missions, achievements, module unlocking
- No backend — `localStorage` + Web Audio API only

## How to Run

```bash
npm install
ng serve
# open http://localhost:4200
```

Tests: `ng test` · Build: `ng build --configuration production`

## Language Rule

| Layer | Language |
|---|---|
| Source code (files, vars, functions, comments) | **English** |
| User-visible UI (labels, buttons, ARIA) | **Portuguese (pt-BR)** |

Strings centralised in `src/app/core/i18n/pt-br.ts` — components use `I18nService.t('key')`.

## Architecture

```
src/app/
├── core/        guards · i18n · models · services · storage
├── data/        modules · exercises · achievements seed data
├── shared/      glass-panel · primary-button · module-card · xp-bar · badge-chip
└── features/    onboarding · home · practice · achievements · profile
```

- Angular 21 standalone components, all with `ChangeDetectionStrategy.OnPush`
- Angular Signals (`signal`, `computed`) for reactive state
- Lazy-loaded feature routes
- Glassmorphism SCSS theme (green primary, dark/light via CSS custom properties)
- Web Audio API: `AudioService.playTone/playInterval/playChord/playMetronomeTick`
- `ProgressService`: XP, levels, streak, achievement checks, module unlocking
- `SettingsService`: volume, dark theme, reduce-motion (persisted + DOM side effects)

## Modules & Gamification

| Module | Prerequisite | Min XP |
|---|---|---|
| Fundamentos | — | 0 |
| Intervalos | Fundamentos | 50 |
| Escalas | Intervalos | 150 |
| Acordes | Escalas | 300 |
| Treino misto | Acordes | 500 |

100 XP = level up. Streak resets if a day is missed.

## Next Steps (Post-MVP)

1. More exercise types (scales, melodic dictation)
2. Backend + auth, cloud sync
3. PWA (service worker, offline)
4. WebMIDI API for instrument input
5. Spaced repetition (SM-2)
6. Additional locales (I18nService is extensible)
7. Adaptive difficulty
8. SVG sheet-music renderer

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
