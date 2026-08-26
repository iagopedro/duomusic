# Convenção de Commits

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/),
adaptado para mensagens em **português**. Todo commit deve seguir este formato.

## Formato

```
<tipo>(<escopo>): <descrição curta no imperativo>

<corpo — opcional, explica o quê e por quê, não o como>

<rodapé — opcional, breaking changes, issues relacionadas>
```

- **Título**: máximo ~72 caracteres, sem ponto final, no imperativo
  ("adicionar", não "adicionado" ou "adiciona").
- **Corpo**: usar quando a mudança não é óbvia pelo título. Preferir
  bullet points (`- `) por assunto/arquivo relevante. Explicar contexto,
  motivação e comportamento — não repetir o diff.
- Cada commit deve representar **uma unidade lógica coesa**. Não
  misturar tipos diferentes (ex: uma feature e um ajuste de estilo não
  relacionado) no mesmo commit.

## Tipos

| Tipo       | Quando usar                                                            |
|------------|-------------------------------------------------------------------------|
| `feat`     | Nova funcionalidade para o usuário final ou para a API                 |
| `fix`      | Correção de bug                                                         |
| `test`     | Adição ou ajuste de testes, sem alterar código de produção             |
| `refactor` | Mudança de código que não altera comportamento externo                 |
| `style`    | Mudanças visuais/CSS/formatação que não afetam lógica                  |
| `docs`     | Alterações apenas em documentação (`docs/`, READMEs, comentários)      |
| `chore`    | Tarefas de manutenção: dependências, configs, scripts, limpeza         |
| `perf`     | Melhoria de performance                                                |
| `build`    | Mudanças no processo de build ou dependências externas                 |
| `ci`       | Mudanças em pipelines/workflows de CI                                  |

## Escopos

Use o escopo para indicar a área afetada. Escopos comuns neste projeto:

- `backend` — mudanças gerais em `backend/app/`
- `frontend` — mudanças gerais em `src/app/`
- Escopos mais específicos quando ajuda a clareza: `backend/auth`,
  `frontend/auth`, `backend/exercises`, `frontend/practice`, etc.
- Sem escopo apenas quando a mudança é transversal (ex: `chore: atualizar
  .gitignore`).

## Exemplos reais do projeto

```
feat(backend): implementar autenticação JWT com registro, login e refresh token

Adiciona um módulo completo de autenticação baseado em JWT, incluindo
persistência assíncrona em banco de dados relacional.

- password.py: hashing de senha com bcrypt (via passlib)
- jwt.py: criação e decodificação de access/refresh tokens
- routers/auth.py: POST /register, /login, /refresh, /logout
```

```
test(frontend): cobrir autenticação com 87 testes (service, interceptor, guard, telas)

- auth.service.spec.ts (19 testes): inicialização, login/register,
  logout, refreshToken e signals computados
- auth.interceptor.spec.ts (10 testes): anexo de token e retry em 401
```

```
style(frontend): suavizar brilho e sombra dos cards de home e módulos
```

```
refactor(backend): cachear ExerciseService com lru_cache
```

```
chore: remover templates de prompt não utilizados
```

## Regras práticas ao gerar commits (para o agente de IA)

1. **Agrupar por unidade lógica**: separar backend de frontend, feature
   de teste, feature de estilo não relacionado, docs de código.
2. **Nunca misturar** uma feature nova com uma correção não relacionada
   no mesmo commit.
3. Preferir múltiplos commits pequenos e descritivos a um commit grande
   genérico ("update files", "wip", "changes").
4. Mensagens sempre em **português**, no imperativo.
5. Sempre revisar `git status`/`git diff` antes de decidir os
   agrupamentos — não assumir que tudo pertence a um único commit.
6. Rodar os testes relevantes antes de commitar quando a mudança afeta
   código de produção.
