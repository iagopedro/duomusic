# DuoMusic

> Plataforma interativa de teoria musical para estudantes iniciantes, inspirada em plataformas como o Duolingo.

O **DuoMusic** é uma aplicação web educacional que ensina teoria musical de forma **interativa, visual e gamificada**. O objetivo é tornar o aprendizado de música acessível para iniciantes, sem exigir conhecimento prévio de leitura de partituras.

> 📚 A documentação técnica detalhada está em [`docs/`](docs/README.md).

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Instalação](#2-instalação)
3. [Contribuição](#3-contribuição)
4. [Tecnologias](#4-tecnologias)

---

## 1. Visão Geral

### Pilares pedagógicos

| Pilar | Como o DuoMusic aplica |
|-------|------------------------|
| **Aprendizado ativo** | O estudante ouve e responde — não apenas lê |
| **Feedback imediato** | Cada exercício mostra se o acerto foi correto e explica o porquê |
| **Progressão gradual** | Módulos desbloqueados conforme o aluno evolui |
| **Motivação contínua** | XP, níveis, conquistas e missões diárias mantêm o engajamento |

### Conceitos musicais abordados

**Ritmo** — organização do som no tempo. Usa semínimas (♩), colcheias (♪) e pausas (𝄽), com velocidade definida em BPM (batidas por minuto).

**Intervalos** — distância entre duas notas, medida em semitons. Exemplos: 3ª maior (4 semitons), 5ª justa (7 semitons), oitava (12 semitons).

**Acordes** — combinação de três ou mais notas tocadas simultaneamente. O DuoMusic trabalha com quatro qualidades: maior, menor, diminuto e aumentado.

**Melodia** — sequência de notas a serem reproduzidas pelo aluno em um piano virtual, avaliada por precisão de notas e tempo.

### Trilha de aprendizado

```
[Fundamentos] ──► [Intervalos] ──► [Escalas] ──► [Acordes] ──► [Treino Misto]
```

Cada módulo é desbloqueado automaticamente ao concluir o anterior e atingir o XP mínimo exigido. Para detalhes da progressão e dos tipos de exercício, consulte [`docs/modules-and-exercises.md`](docs/modules-and-exercises.md).

### Gamificação

O aluno acumula **XP** ao acertar exercícios, sobe de **nível** a cada 100 XP, mantém um **streak** de dias praticando e desbloqueia **conquistas** ao atingir marcos. Mais detalhes em [`docs/gamification.md`](docs/gamification.md).

---

## 2. Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- npm 10 ou superior

### Passos

```bash
git clone https://github.com/iagopedro/duomusic.git
cd duomusic
npm install
npm start
```

Acesse [http://localhost:4200](http://localhost:4200).

### Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm start` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção em `dist/duomusic/` |
| `npm test` | Executa os testes unitários |
| `npm run test:coverage` | Executa testes com relatório de cobertura |
| `npm run deploy` | Publica o build no GitHub Pages |

---

## 3. Contribuição

Contribuições são bem-vindas. O fluxo resumido é:

1. Crie uma branch a partir da `main`
2. Implemente sua alteração seguindo as convenções do projeto (componentes standalone, OnPush, testes para toda lógica nova)
3. Garanta que `npm test` passa sem erros
4. Abra um Pull Request descrevendo o impacto da mudança

Para instruções detalhadas sobre como adicionar **novos exercícios, módulos, conquistas ou telas**, consulte [`docs/contributing.md`](docs/contributing.md).

---

## 4. Tecnologias

| Tecnologia | Versão | Papel |
|------------|--------|-------|
| [Angular](https://angular.dev) | 21.2.x | Framework principal (SPA) |
| [Angular Material](https://material.angular.dev) | 21.x | Componentes de UI (ícones) |
| [Web Audio API](https://developer.mozilla.org/docs/Web/API/Web_Audio_API) | nativa do browser | Síntese de som em tempo real |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Tipagem estática |
| [SCSS](https://sass-lang.com/) | — | Estilização com variáveis e BEM |
| [Vitest](https://vitest.dev/) | 4.1.x | Test runner para testes unitários |
| [gh-pages](https://www.npmjs.com/package/gh-pages) | 6.x | Publicação do build no GitHub Pages |

---

*DuoMusic v1.1 — abril de 2026*