# DuoMusic

> Plataforma interativa de teoria musical para estudantes iniciantes, inspirada em plataformas como o Duolingo.

O **DuoMusic** é uma aplicação web educacional que ensina teoria musical de forma **interativa, visual e gamificada**. O objetivo é tornar o aprendizado de música acessível para iniciantes, sem exigir conhecimento prévio de leitura de partituras.

> 📚 A documentação técnica detalhada está em [`docs/`](docs/README.md).

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Instalação](#2-instalação)
3. [Executando o Backend](#3-executando-o-backend)
4. [Executando o Frontend](#4-executando-o-frontend)
5. [Contribuição](#5-contribuição)
6. [Tecnologias](#6-tecnologias)

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

| Requisito | Versão mínima | Papel |
|-----------|--------------|-------|
| [Node.js](https://nodejs.org/) | 20 | Execução do frontend Angular |
| npm | 10 | Gerenciador de pacotes do frontend |
| [Python](https://www.python.org/) | 3.11 | Execução do backend FastAPI |

### Clonando e instalando dependências do frontend

```bash
git clone https://github.com/iagopedro/duomusic.git
cd duomusic
npm install
```

---

## 3. Executando o Backend

> ⚠️ **O backend deve ser iniciado antes do frontend.** O Angular consome a API REST em `http://localhost:8000`. Sem ela, a aplicação exibe a tela de modo offline.

O backend usa **FastAPI + Uvicorn** com um ambiente virtual Python isolado em `backend/.venv`.

### Pré-requisito: configurar o `.env`

Copie o arquivo de exemplo e ajuste as variáveis conforme necessário:

```bash
cp backend/.env.example backend/.env
```

A configuração padrão funciona sem LLM habilitado (`DUOMUSIC_LLM_ENABLED=false`). Para habilitar respostas geradas por IA, defina `DUOMUSIC_LLM_API_KEY` com sua chave do provedor escolhido.

### Criando o ambiente virtual (primeira vez)

**Linux / macOS**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows (PowerShell)**
```powershell
cd backend
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Windows (Prompt de Comando)**
```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
```

### Iniciando o servidor

**Linux / macOS**
```bash
# a partir do diretório backend/
source .venv/bin/activate
uvicorn app.main:app --reload
```

**Windows (PowerShell)**
```powershell
# a partir do diretório backend/
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

**Windows (Prompt de Comando)**
```cmd
rem a partir do diretório backend/
.venv\Scripts\activate.bat
uvicorn app.main:app --reload
```

O servidor estará disponível em **http://localhost:8000**. Com `DUOMUSIC_DEBUG=true` no `.env`, a documentação interativa é acessível em http://localhost:8000/docs.

---

## 4. Executando o Frontend

Com o backend em execução, abra outro terminal na raiz do projeto:

```bash
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

## 5. Contribuição

Contribuições são bem-vindas. O fluxo resumido é:

1. Crie uma branch a partir da `main`
2. Implemente sua alteração seguindo as convenções do projeto (componentes standalone, OnPush, testes para toda lógica nova)
3. Garanta que `npm test` passa sem erros
4. Abra um Pull Request descrevendo o impacto da mudança

Para instruções detalhadas sobre como adicionar **novos exercícios, módulos, conquistas ou telas**, consulte [`docs/contributing.md`](docs/contributing.md).

---

## 6. Tecnologias

| Tecnologia | Versão | Papel |
|------------|--------|-------|
**Frontend**

| Tecnologia | Versão | Papel |
|------------|--------|-------|
| [Angular](https://angular.dev) | 21.2.x | Framework principal (SPA) |
| [Angular Material](https://material.angular.dev) | 21.x | Componentes de UI (ícones) |
| [Web Audio API](https://developer.mozilla.org/docs/Web/API/Web_Audio_API) | nativa do browser | Síntese de som em tempo real |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Tipagem estática |
| [SCSS](https://sass-lang.com/) | — | Estilização com variáveis e BEM |
| [Vitest](https://vitest.dev/) | 4.1.x | Test runner para testes unitários |
| [gh-pages](https://www.npmjs.com/package/gh-pages) | 6.x | Publicação do build no GitHub Pages |

**Backend**

| Tecnologia | Versão | Papel |
|------------|--------|-------|
| [Python](https://www.python.org/) | 3.11+ | Linguagem do servidor |
| [FastAPI](https://fastapi.tiangolo.com/) | 0.115+ | Framework da API REST |
| [Uvicorn](https://www.uvicorn.org/) | 0.32+ | Servidor ASGI com hot-reload |
| [Pydantic](https://docs.pydantic.dev/) | 2.x | Validação e serialização de dados |
| [LangChain](https://python.langchain.com/) | 0.3+ | Integração com modelos de linguagem (opcional) |
| [pytest](https://pytest.org/) | — | Testes unitários do backend |

---

*DuoMusic v1.1 — abril de 2026*