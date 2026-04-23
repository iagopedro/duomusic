# Módulos de Aprendizado e Tipos de Exercício

## Módulos de aprendizado

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

## Tipos de exercício

### 1. Exercício de Ritmo (`RhythmExercise`)

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

### 2. Exercício de Intervalo (`IntervalExercise`)

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

### 3. Exercício de Acorde (`ChordExercise`)

O aluno ouve três notas tocadas simultaneamente e deve identificar a qualidade do acorde.

**Estrutura dos acordes:**

| Tipo | Intervalos gerados |
|------|-------------------|
| major | 0, +4, +7 semitons |
| minor | 0, +3, +7 semitons |
| dim | 0, +3, +6 semitons |
| aug | 0, +4, +8 semitons |

### 4. Exercício de Identificação de Nota (`NoteExercise`)

O aluno ouve uma nota e deve identificá-la. O piano virtual fica disponível para **exploração livre** antes da resposta.

```typescript
interface NoteExercise extends BaseExercise {
  type: 'note-id';
  noteFreq: number;   // frequência da nota tocada
  noteName: string;   // resposta correta, ex.: 'C4'
  showHint: boolean;  // pisca brevemente a tecla-alvo antes de esconder
}
```

**Fluxo do exercício:**
1. A aplicação toca a nota; se `showHint=true`, a tecla pisca brevemente
2. O piano fica disponível para **exploração livre** — o aluno toca quantas teclas quiser sem avaliação
3. O aluno seleciona a resposta entre **4 alternativas** (nota correta + 3 distratoras naturais)
4. A avaliação ocorre na seleção da alternativa

### 5. Exercício de Melodia (`MelodyExercise`)

O aluno ouve uma melodia e deve reproduzi-la no piano. Inclui **exploração livre** antes da tentativa avaliada.

```typescript
interface MelodyExercise extends BaseExercise {
  type: 'melody';
  notes: MelodyNote[];  // sequência de { note, freq, durationMs }
  bpm: number;
}
```

**Fluxo do exercício:**
1. **`listen`** — aplicação toca a melodia com iluminação das teclas; aluno pode ouvir novamente
2. **`explore`** — piano livre para exploração, sem avaliação e sem limite de tempo
3. **`countdown`** — ao acionar "Registrar tentativa", contagem regressiva **3 → 2 → 1 → GO!** sincronizada com metrônomo
4. **`recording`** — janela de gravação: o aluno executa a melodia; encerra automaticamente após tempo limite ou ao completar todas as notas
5. **Avaliação** — score calculado e exibido ao aluno

**Cálculo do score (0%–100%):**

| Componente | Peso | Critério |
|-----------|------|----------|
| Precisão de notas | 60% | Notas corretas na ordem certa |
| Precisão de tempo | 40% | Proximidade ao tempo esperado de cada nota |

**Critério de aprovação:** score ≥ 70%. O aluno pode repetir a tentativa quantas vezes precisar.
