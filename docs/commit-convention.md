# Convenção de Commits

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/),
adaptado para mensagens em **português** e **simplificado para uma única linha**.

## Formato

```
<tipo>(<escopo>): <descrição curta no imperativo>
```

**Regras:**
- Máximo ~72 caracteres, sem ponto final, no imperativo ("adicionar", não "adicionado").
- **Sem corpo e sem rodapé** — apenas o título.
- Cada commit deve representar **uma unidade lógica coesa**.
- Informações detalhadas (contexto, motivação, decisões técnicas) devem estar
  na **documentação interna** (`docs/`), não nos commits.

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

## Exemplos

```
feat(backend): implementar autenticação JWT com registro, login e refresh token
test(frontend): cobrir autenticação com 87 testes
style(frontend): suavizar brilho e sombra dos cards de home e módulos
refactor(backend): cachear ExerciseService com lru_cache
chore: remover templates de prompt não utilizados
docs: adicionar guia de deploy na cloud
```

## Regras práticas ao gerar commits (para o agente de IA)

1. **Apenas uma linha** — nunca adicionar corpo ou rodapé.
2. **Agrupar por unidade lógica**: separar backend de frontend, feature
   de teste, feature de estilo não relacionado, docs de código.
3. **Nunca misturar** uma feature nova com uma correção não relacionada
   no mesmo commit.
4. Preferir múltiplos commits pequenos e descritivos a um commit grande
   genérico ("update files", "wip", "changes").
5. Mensagens sempre em **português**, no imperativo.
6. Sempre revisar `git status`/`git diff` antes de decidir os
   agrupamentos — não assumir que tudo pertence a um único commit.
7. Rodar os testes relevantes antes de commitar quando a mudança afeta
   código de produção.
8. **Documentar contexto em `docs/`** — decisões técnicas, motivações e
   detalhes de implementação pertencem aos documentos internos, não aos commits.
