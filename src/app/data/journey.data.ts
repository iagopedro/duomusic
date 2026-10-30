import { ModuleId, TheoryExercise } from '../core/models';

export type PracticeMode = 'guided' | 'standard' | 'challenge';

export const MODULE_CONCEPTS: Record<ModuleId, string> = {
  fundamentals: 'Notas, pulsação e memória musical',
  intervals: 'Distâncias entre notas e reconhecimento auditivo',
  scales: 'Tons, semitons e organização das escalas',
  chords: 'Tríades, terças e função harmônica',
  mixed: 'Conexões entre ritmo, melodia e harmonia',
};

type Question = [question: string, options: string[], answer: string, explanation: string];

const QUESTIONS: Record<ModuleId, Question[]> = {
  fundamentals: [
    ['Quantas colcheias duram o mesmo que uma semínima?', ['Uma', 'Duas', 'Três', 'Quatro'], 'Duas', 'Uma colcheia dura metade de uma semínima. Duas colcheias ocupam um tempo quando a semínima vale um tempo.'],
    ['Entre quais notas naturais há apenas um semitom?', ['Dó e Ré', 'Ré e Mi', 'Mi e Fá', 'Fá e Sol'], 'Mi e Fá', 'Mi–Fá e Si–Dó são os dois pares de notas naturais separados por um semitom. No piano, não há tecla preta entre eles.'],
    ['Em um compasso 6/8 composto, qual figura representa cada um dos dois pulsos?', ['Semínima', 'Colcheia', 'Semínima pontuada', 'Mínima'], 'Semínima pontuada', 'No 6/8 composto, seis colcheias se agrupam em dois pulsos de três colcheias. Cada pulso equivale a uma semínima pontuada.'],
  ],
  intervals: [
    ['Quantos semitons formam uma terça maior?', ['Dois', 'Três', 'Quatro', 'Sete'], 'Quatro', 'A terça maior tem quatro semitons, como Dó–Mi. A terça menor tem três, como Dó–Mi bemol.'],
    ['Qual é a inversão de uma terça maior?', ['Sexta menor', 'Sexta maior', 'Quinta justa', 'Terça menor'], 'Sexta menor', 'Intervalos invertidos somam nove em seus números e doze semitons. Uma terça maior (4) torna-se uma sexta menor (8).'],
    ['Dó–Fá sustenido e Dó–Sol bemol têm o mesmo som no temperamento igual. Como se chamam?', ['Duas quintas justas', 'Quarta aumentada e quinta diminuta', 'Quarta justa e quinta justa', 'Terça maior e sexta menor'], 'Quarta aumentada e quinta diminuta', 'Ambos têm seis semitons, mas a grafia determina o nome: Dó–Fá é uma quarta e Dó–Sol é uma quinta. São intervalos enarmônicos.'],
  ],
  scales: [
    ['Qual sequência de passos forma a escala maior? T = tom; S = semitom.', ['T T S T T T S', 'T S T T S T T', 'T T T S T T S', 'S T T S T T T'], 'T T S T T T S', 'A escala maior tem semitons entre os graus 3–4 e 7–8. Toque Dó–Ré–Mi–Fá–Sol–Lá–Si–Dó e observe Mi–Fá e Si–Dó.'],
    ['Qual é a relativa menor de Dó maior?', ['Dó menor', 'Ré menor', 'Lá menor', 'Mi menor'], 'Lá menor', 'A relativa menor começa no sexto grau da escala maior. Lá menor natural e Dó maior usam as mesmas notas, mas têm tônicas diferentes.'],
    ['O que distingue Ré dórico de Ré menor natural?', ['Terça maior', 'Sexta maior', 'Sétima maior', 'Quinta diminuta'], 'Sexta maior', 'Ré dórico contém Si natural; Ré menor natural contém Si bemol. A sexta maior é a cor característica do modo dórico.'],
  ],
  chords: [
    ['Quais notas formam a tríade de Dó maior?', ['Dó Mi Sol', 'Dó Mi bemol Sol', 'Dó Fá Sol', 'Dó Ré Sol'], 'Dó Mi Sol', 'Uma tríade maior reúne fundamental, terça maior e quinta justa: 0, 4 e 7 semitons. Em Dó: Dó–Mi–Sol.'],
    ['Qual estrutura forma uma tríade diminuta?', ['0, 4, 7', '0, 3, 7', '0, 3, 6', '0, 4, 8'], '0, 3, 6', 'A tríade diminuta tem terça menor e quinta diminuta. São duas terças menores empilhadas: 3 + 3 semitons.'],
    ['Em Dó maior, quais notas de Sol7 formam o trítono que resolve na tônica?', ['Sol e Ré', 'Si e Fá', 'Sol e Si', 'Ré e Fá'], 'Si e Fá', 'Si e Fá estão separados por um trítono. Na resolução habitual em Dó maior, Si sobe para Dó e Fá desce para Mi.'],
  ],
  mixed: [
    ['Ao dobrar a frequência de uma nota, qual intervalo ouvimos?', ['Quinta justa', 'Oitava', 'Terça maior', 'Uníssono'], 'Oitava', 'Uma oitava corresponde à razão de frequência 2:1. Lá a 440 Hz e Lá a 880 Hz têm o mesmo nome, em oitavas diferentes.'],
    ['Qual acorde é o V grau de Dó maior?', ['Ré menor', 'Fá maior', 'Sol maior', 'Lá menor'], 'Sol maior', 'O quinto grau de Dó maior é Sol. Sua tríade diatônica é Sol–Si–Ré, um acorde maior com função dominante.'],
    ['Qual sequência representa ii–V–I em Dó maior com tétrades diatônicas?', ['Dm7 G7 Cmaj7', 'D7 Gmaj7 Cm7', 'Dm7 Gm7 C7', 'Dmaj7 G7 Cm7'], 'Dm7 G7 Cmaj7', 'O ii é menor com sétima menor, o V é dominante e o I é maior com sétima maior: Ré–Fá–Lá–Dó, Sol–Si–Ré–Fá e Dó–Mi–Sol–Si.'],
  ],
};

export function theoryForModule(moduleId: ModuleId, mode: PracticeMode, lessonIndex: number): TheoryExercise {
  const difficulty = mode === 'guided' ? 1 : mode === 'challenge' ? 3 : 2;
  const [questionKey, options, answer, explanationKey] = QUESTIONS[moduleId][difficulty - 1];
  return {
    id: `theory-${moduleId}-${lessonIndex}-${difficulty}`,
    moduleId, type: 'theory', difficulty, xpReward: 5,
    conceptKey: MODULE_CONCEPTS[moduleId], questionKey, options, answer, explanationKey,
  };
}