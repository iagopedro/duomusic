# Módulos de Aprendizado e Tipos de Exercício

## Jornada interativa

### Direção do produto e experiência visual

O objetivo do DuoMusic é tornar o aprendizado musical divertido e utilizável como
um **serious game**: descobrir um conceito, praticar, receber feedback educativo,
revisar e perceber a evolução. As recompensas incentivam mais prática; erros não
consomem vidas nem impedem novas tentativas.

A identidade de estúdio musical usa verde como cor primária, superfícies sólidas,
tipografia e componentes compartilhados. A navegação fica na lateral em desktop
e na base em dispositivos móveis; não aparece durante autenticação ou prática.
Na jornada, a próxima lição ganha destaque, unidades bloqueadas são recolhíveis
e as missões exibem progresso e recompensas reais. O resumo convida a continuar
a jornada, retornando à trilha para escolher a próxima lição.

As animações comunicam entrada de conteúdo, reprodução de áudio, seleção,
acertos, XP e estrelas. Animações decorativas terminam após a apresentação;
indicadores de áudio acompanham a duração programada da reprodução. Tanto a
preferência do sistema `prefers-reduced-motion` quanto a opção do perfil reduzem
os movimentos, inclusive as transições Angular. O estado continua compreensível
por texto, ícones, bordas e foco visível, sem depender apenas de cor ou animação.
As transições nativas entre rotas também são dispensadas nesses casos. O motor
de animações Angular é inicializado no bootstrap para aplicar a preferência antes
da primeira animação de prática.

Esta atualização visual não altera os critérios de pontuação, desbloqueio ou
persistência descritos abaixo. Os tokens comuns ficam em `src/styles.scss`;
os formulários de autenticação compartilham `src/app/features/auth/auth-form.scss`.

#### Padrões visuais da jornada

- **Paleta:** verde vivo no destaque da próxima prática; superfícies neutras nos
  temas claro e escuro. Dourado sinaliza recompensas, azul e violeta diferenciam
  conceitos musicais. A preferência de tema salva e o tema padrão são preservados.
- **Hierarquia:** Poppins com fallback do sistema, títulos curtos, texto de apoio
  e espaçamento em múltiplos de 4 px. Cards arredondados e sombras discretas separam
  unidades, missões e configurações sem competir com o botão principal.
- **Navegação:** lateral em desktop e cápsula escura na base em mobile, com ícone,
  texto e estado ativo. A cápsula ocupa espaço no layout, sem cobrir o conteúdo.
- **Progresso:** o destaque da jornada mede lições efetivamente concluídas;
  XP de nível, missões e desafios da sessão continuam com suas métricas próprias.
  Não são exibidos rankings, comparações inventadas nem contadores de vidas.
- **Prática e conquistas:** cards de exercícios em camadas, seleção com borda
  reforçada e `aria-pressed`, feedback educativo e medalhas com requisito e estado
  textual. A celebração usa os resultados reais; não adiciona recompensa ou resgate.
- **Acessibilidade:** áreas de toque, foco visível, contraste, layout sem rolagem
  horizontal e redução de movimento pelos dois mecanismos já suportados.

A página inicial apresenta uma trilha de unidades e lições. Cada lição combina **até três exercícios práticos**, na ordem do catálogo, com **uma pergunta de teoria**. A lição seguinte abre quando os exercícios práticos da anterior foram acertados; o progresso existente é preservado.

O currículo usa os IDs estáveis do catálogo, sem depender da geração por IA. O **treino livre** permite escolher qualquer módulo, inclusive bloqueado na trilha, e usa até cinco exercícios gerados com fallback para o catálogo, mais uma pergunta de teoria. Seus IDs práticos recebem o prefixo `free-`: o treino rende XP, mas não substitui os requisitos das lições.

### Modos de experiência

| Modo | Teoria | Ritmo e melodia | Identificação de notas |
|------|--------|----------------|------------------------|
| Guiado | Fundamentos | 80% do andamento original; ritmo exige 60% de precisão | Referência visual |
| Prática | Relações entre conceitos | Andamento original; ritmo exige 80% de precisão | Pistas conforme o exercício |
| Desafio | Inversões, modos, enarmonia e funções harmônicas | 120% do andamento original; ritmo exige 95% de precisão | Sem pista visual |

O modo é escolhido antes de iniciar e salvo no dispositivo. No desafio, acordes sempre oferecem as quatro qualidades de tríade. A duração das notas da melodia acompanha o andamento; a tolerância rítmica varia inversamente à velocidade. As recompensas-base não mudam com o modo.

### Feedback, revisão e recompensas

1. Cada resposta recebe feedback musical e, quando aplicável, a resposta correta explicada. O acerto **não avança automaticamente**.
2. O aluno pode repetir um erro imediatamente ou deixá-lo para o fim. Erros voltam em rodadas de revisão até serem corrigidos, sem limite de vidas.
3. Cada desafio concede seu XP no máximo uma vez por sessão. Submissões repetidas durante o feedback são ignoradas.
4. A barra mede desafios distintos acertados; a precisão considera **todas as tentativas**, inclusive erros e revisões.
5. O resumo mostra XP dos exercícios, melhor sequência e estrelas: três com 100% de precisão, duas a partir de 70%, uma abaixo disso.
6. Missões diárias creditam seu bônus automaticamente e uma única vez ao serem completadas. Esses bônus entram no XP global, separado do XP dos exercícios mostrado no resumo.

A tela inicial recomenda revisão quando há erros ainda não corrigidos. A revisão prioriza até três exercícios do catálogo com última tentativa incorreta; se não houver correspondência no catálogo, abre a próxima lição disponível. No treino misto, os resultados pertencem a `mixed`, mesmo quando o exercício reutiliza conteúdo de outra unidade.

Ao sair por meio da seta durante a sessão, uma confirmação mantém a opção de continuar. XP e resultados já registrados permanecem salvos. Sessões em andamento, estrelas e sequência da sessão não são restauradas após recarregar a página. O progresso continua usando o armazenamento local existente; esta evolução não adiciona sincronização entre dispositivos nem um teste de nivelamento.

## Módulos de aprendizado

Os módulos seguem uma progressão pedagógica cuidadosamente ordenada:

```
[Fundamentos] ──► [Intervalos] ──► [Escalas] ──► [Acordes] ──► [Treino Misto]
   0 XP             50 XP           150 XP         300 XP         500 XP
```

| Módulo | ID | XP mínimo | Exercícios | Foco pedagógico |
|--------|----|-----------|-----------|-----------------|
| Fundamentos | `fundamentals` | 0 | n-1 a n-5, r-1 a r-3, m-1 a m-6 | Notas, percepção rítmica e memória melódica |
| Intervalos | `intervals` | 50 | i-1 a i-4 | Ouvido harmônico básico |
| Escalas | `scales` | 150 | i-5, i-6 + teoria | Intervalos, escala maior, relativa menor e modo dórico |
| Acordes | `chords` | 300 | c-1, c-2, c-3 | Qualidade dos acordes |
| Treino misto | `mixed` | 500 | r-1, i-2, c-1, i-4, r-3 + teoria | Revisão geral e funções harmônicas |

**Regra de desbloqueio**: um módulo abre automaticamente quando o módulo anterior é completado (todos os exercícios práticos do catálogo com acerto) **e** o aluno possui o XP mínimo exigido. O requisito de XP é reavaliado após cada resultado, inclusive quando o módulo anterior já foi concluído.

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
6. Acerto: precisão mínima de 60%, 80% ou 95%, conforme o modo; `precisão = max(0, acertos - toques extras) / batidas não-pausa`

O botão de pulso aceita clique e toque em celular. A tecla Espaço também funciona; eventos repetidos ao manter a tecla pressionada são ignorados fora dos controles nativos.

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

### 6. Exercício de Teoria (`TheoryExercise`)

Pergunta de múltipla escolha com quatro alternativas, confirmação explícita e explicação musical após a resposta. Participa do mesmo ciclo de revisão e concede 5 XP por acerto único na sessão.

O banco inicial contém 15 perguntas: uma por combinação de módulo e modo. A mesma pergunta pode reaparecer em lições distintas do mesmo módulo e modo; não há geração de novas perguntas teóricas nesta versão.

```typescript
interface TheoryExercise extends BaseExercise {
  type: 'theory';
  options: string[];
  answer: string;
}
```

O conteúdo e as adaptações ficam em `src/app/data/journey.data.ts` e `JourneyService`. Perguntas de teoria são compostas no frontend; o contrato de geração de exercícios do backend permanece inalterado.
