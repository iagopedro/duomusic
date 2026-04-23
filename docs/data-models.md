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

Todo o progresso é **persistido no `localStorage`** via `StorageService`, garantindo que o aluno não perca seu histórico ao fechar o browser.
