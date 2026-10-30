# Lições aprendidas

Registro curto e objetivo das lições de cada implementação. Adicione uma seção nova
ao final de cada entrega.

## Refatoração visual (referências de app educacional)

- Respeite os budgets de estilo de componente (aviso 8 kB, erro 12 kB): enxugue o
  SCSS em vez de aumentar o limite.
- Valide o contraste do texto sobre gradientes (mínimo 4.5:1); use
  `expectTextContrast` em `tests/e2e/fixtures.ts`.
- A redução de movimento precisa cobrir View Transitions de rota
  (`onViewTransitionCreated`) e animações de entrada, não só o CSS.
- Componentes standalone precisam importar `MatIconModule` explicitamente.
- Ao mudar textos visíveis, atualize as expectativas do E2E e regenere baselines
  visuais somente após revisar as diferenças.

## Página offline e reconexão

- Um estado de erro em signal precisa ser limpo quando houver sucesso; se a falha
  só é marcada, toda nova tentativa continua sendo vista como offline.
- Em app zoneless com OnPush, estado de UI deve ficar em `signal`; campos comuns
  não atualizam a tela depois de `await`.
- Reaproveite a requisição em andamento (`pendingInitialize`) para evitar chamadas
  duplicadas com cliques repetidos ou inicializações simultâneas.
- Em telas de recuperação, redirecione com `replaceUrl: true` para `/home` e deixe
  os guards decidirem entre login e onboarding.
- Anuncie resultado de tentativas com `role="status"`.
- E2E: simule falha com `page.route(...)` e restaure a resposta da fixture com
  `page.unroute(...)`. Toda nova chamada à API precisa estar modelada na fixture.
- Vitest local: use `VITEST_MAX_WORKERS=1` e `NG_BUILD_MAX_WORKERS=2`.
- Pendência conhecida: se o app iniciar com o backend fora do ar, a sessão salva é
  apagada e o usuário precisa entrar de novo após reconectar.
