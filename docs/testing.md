# Testes e regressões de interface

A cobertura é organizada por riscos e cenários verificáveis, não por uma promessa
de “todos os casos possíveis”. A [matriz de autenticação](auth-test-matrix.md)
distingue cobertura executável de planejamento histórico.

## Por que o erro `[object Object]` passou

O Angular aceitava `iago@gmail`, mas o `EmailStr` do backend rejeitava o domínio
incompleto. O FastAPI respondia HTTP 422 com `detail` como **lista de objetos**.
O serviço atribuía esse valor diretamente ao estado de erro: o `any` de
`HttpErrorResponse.error` contornava a tipagem `string`. A interpolação no HTML
então mostrava `[object Object]`.

As specs dos formulários substituíam o serviço por um mock que só emitia strings.
Os testes de serviço não incluíam esse contrato 422; os testes de validação do
backend verificavam o status, não o conteúdo consumido pela interface. Inspeção
manual com uma API simulada não substituía essa integração. O deploy também não
exigia testes.

Agora o teste usa uma [resposta real de validação](../tests/fixtures/auth-validation-error.json)
e verifica **HTTP → interceptor → serviço real → DOM**. Ele falhou antes da
correção e passa após ela. Objetos, `input`, `ctx` e mensagens internas da lista
não são mostrados ao aluno. A API continua responsável pela validação definitiva:
o validator local não pretende reproduzir todo o algoritmo `EmailStr`.

O navegador também revelou uma falha na restauração da sessão: o serviço iniciava
HTTP durante sua construção e o interceptor tentava injetá-lo novamente. Essa
ordem foi corrigida e há regressão com tokens salvos, sem refresh indevido.

## 1. Angular: unidades e integração

```powershell
npm test -- --watch=false
npm test -- --watch=false --include="**/{auth-http.integration,auth.service,auth.interceptor,email.validator,login.component,register.component}.spec.ts"
npm run test:coverage -- --watch=false
```

Em ambientes com poucos recursos:

```powershell
$env:VITEST_MAX_WORKERS='1'
$env:NG_BUILD_MAX_WORKERS='2'
npm test -- --watch=false
```

- [Integração de autenticação](../src/app/features/auth/auth-http.integration.spec.ts):
  status HTTP, corpos variados, mensagens acessíveis, loading, reenvio, ausência
  de navegação/salvamento no erro, limpeza entre formulários e restauração.
- [Matriz de respostas](../tests/fixtures/auth-error-cases.ts): compartilhada pelo
  teste Angular e pelo navegador; não mocka o normalizador de produção.
- [Email](../src/app/core/auth/email.validator.spec.ts): domínio incompleto,
  formatos inválidos, subdomínio, `+`, hífen e campo obrigatório.
- As specs existentes de componentes, progresso, jornada, áudio, guards e
  interceptor continuam cobrindo seus comportamentos específicos.

O projeto é **zoneless**: use `async/await`, `fixture.whenStable()` e ferramentas
Vitest; não use `fakeAsync/tick` sem Zone.js. Em componentes OnPush, altere inputs
com `fixture.componentRef.setInput()`. Um teste que usa mock do serviço é teste
de bindings/componente, não integração HTTP.

## 2. Contrato FastAPI/schema

Com as dependências de desenvolvimento do backend instaladas:

```powershell
python -m pip install -r backend\requirements-dev.txt
python -m pytest tests\contracts -o pythonpath=backend -q
```

O [teste de contrato](../tests/contracts/test_auth_validation.py) usa os schemas
reais e a serialização de validação do FastAPI em uma aplicação mínima. Compara
o JSON 422 integral com o fixture usado pelo frontend e verifica limites de
senha/nome. Não inicia o lifespan do aplicativo principal, não cria usuários e
não acessa o banco. Não substitui os testes dos routers, JWT ou persistência:

```powershell
Set-Location backend
python -m pytest tests\test_auth_routers.py -q
```

## 3. Navegador e regressão visual (Playwright/Chromium)

```powershell
npm ci
npx playwright install chromium
npm run test:e2e:types
npm run test:e2e
# Um cenário ou grupo:
npm run test:e2e -- --grep "FastAPI 422 real"
```

A [configuração](../playwright.config.ts) inicia e encerra um servidor próprio em
`127.0.0.1:4300`; a porta deve estar livre. Não reutiliza os servidores de
desenvolvimento em 4200/8000. Cada teste recebe contexto/localStorage isolados.
As requisições de API são interceptadas, sem substituir serviços Angular.
Requisições não previstas e erros JavaScript não tratados fazem o teste falhar.
Catálogos vêm dos dados versionados do projeto; credenciais são sintéticas.

Cobertura persistente:

- Login e cadastro: matriz de erros, teclado, validação local, senha visível,
  limites, confirmação, loading, submit duplicado, retry, sucesso e reload.
- **48 imagens de referência**: os dois formulários, temas claro/escuro,
  larguras 320/390/768/1440, estados vazio/inválido/422. Texto do erro nunca é
  mascarado; assertions semânticas precedem a comparação de pixels.
- Texto longo e marcação HTML tratados como texto, sem overflow horizontal.
- Contraste mínimo 4,5:1 nos principais textos/controles ativos da autenticação.
- Movimento reduzido pelo sistema e pela preferência do perfil.
- Smokes: guards, onboarding, navegação, bloqueio de lições, configurações
  persistidas, tutorial, prática com erro/revisão/recompensa e progresso salvo;
  superfícies de ritmo, melodia, intervalos e acordes; indisponibilidade da API.
- [Interface de aprendizado](../tests/e2e/learning-ui.spec.ts): jornada,
  conquistas, perfil e prática nos dois temas, em 320/390/768/1440 px;
  progresso acessível, alvos de navegação de pelo menos 44 px, cápsula sem
  sobreposição, ausência de overflow, contraste de textos/CTA e das duas
  extremidades do destaque verde. Também verifica teclado e ausência de animações
  ativas de rota/prática com movimento reduzido pelo sistema/perfil. Capturas para
  inspeção são salvas em `test-results`;
  não são usadas como comparações de pixels.

### Revisar imagens, não aceitar diferenças cegamente

As [referências](../tests/e2e/baselines/win32) foram geradas em Windows/Chromium.
A CI usa Windows 2025, versão Playwright fixada, relógio e viewport controlados.
O CDN de fontes é desabilitado **nos testes** para comparar o fallback de fontes
do sistema sem dependência de rede; fontes remotas e renderização em outros
sistemas exigem inspeção separada.

```powershell
npm run test:e2e:update -- --grep "empty, invalid and API error"
npm run test:e2e
```

Revise cada imagem alterada, mensagens e layout antes de versionar a referência.
Não atualize baselines para “resolver” testes quebrados. Em outro sistema,
gere/revise as referências daquela plataforma ou use o mesmo ambiente da CI.
O comando normal não atualiza snapshots. Há tolerância de apenas 60 pixels por
imagem; isso não substitui as verificações exatas de texto, estado e geometria.

Falhas geram screenshot, trace e relatório HTML em `test-results` e
`playwright-report` (ignorados pelo Git). A CI retém essas evidências por 7 dias.

## CI e limites

O [workflow de testes](../.github/workflows/test.yml) roda em pull requests e é
pré-requisito do [deploy](../.github/workflows/deploy.yml). Valida unidades,
integração, tipos E2E, navegador, contrato e build. Não atualiza imagens na CI.

A suíte não equivale a E2E contra backend/banco reais. Ainda precisam de
validação específica: Firefox/WebKit, leitores de tela, fontes remotas,
dispositivos e latência de áudio/Bluetooth, scoring temporal no navegador,
geração LLM, sessões prolongadas e todas as combinações de progresso salvo.
Um novo bug deve gerar um cenário mínimo **vermelho antes do fix**, no nível
onde escapou, e atualizar a matriz. Quantidade de testes não prova completude.
