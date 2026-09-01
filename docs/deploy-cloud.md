# DuoMusic — Guia de Deploy na Cloud

Este documento descreve como fazer deploy do backend DuoMusic em provedores de cloud brasileiros ou com baixa latência para o Brasil.

## Provedores Recomendados

### 🏆 Opção Principal: Render (render.com)

**Por quê?**
- Free tier generoso (750 horas/mês)
- PostgreSQL managed gratuito (tier limitado, 90 dias)
- Deploy automático via GitHub
- SSL gratuito
- Boa documentação

**Custos:**
- Free tier: US$0 (spin down após 15min de inatividade)
- Starter: US$7/mês (sempre ativo)
- PostgreSQL Starter: US$7/mês (após free tier)

---

### 🌐 Alternativa 1: Fly.io (fly.io)

**Por quê?**
- Região `gru` (São Paulo) disponível
- Free tier: 3 VMs compartilhadas
- Excelente para baixa latência

**Custos:**
- Free tier disponível
- Pay-as-you-go após limites

---

### 🇧🇷 Opção 100% Brasileira: Kinghost

**Por quê?**
- Servidores no Brasil
- Pagamento em reais
- Suporte em português

**Custos:**
- Container a partir de R$49/mês
- Cloud VPS a partir de R$29/mês

---

### 📅 Migração Futura Planejada: Locaweb

**Por quê?** 100% brasileira, atendimento em português, pagamento em reais. Diferente do Render/Fly.io/Kinghost acima, a Locaweb opera como **IaaS** (Cloud/VPS) e não como PaaS: não há "Web Service" que builda o Dockerfile automaticamente a partir do GitHub — você provisiona uma VM e roda o container você mesmo.

- **Locaweb Cloud**: VMs com recursos isolados, cobrança por hora (pay-as-you-go), API/Terraform — a partir de R$20/mês
- **VPS Locaweb**: servidor virtualizado pré-configurado, cobrança mensal/trimestral fixa — a partir de R$15,90/mês

Veja a seção ["Preparando a Migração Futura para Locaweb"](#preparando-a-migração-futura-para-locaweb) para o que muda em relação ao Render.

---

## Monorepo: backend e frontend no mesmo repositório

**Não é necessário criar um repositório separado.** O Render tem suporte nativo a monorepos: cada serviço aponta para o mesmo repositório GitHub, mas define seu próprio **Root Directory** (pasta raiz). Só os arquivos dentro dessa pasta são usados no build/deploy daquele serviço.

- Serviço do **backend** → Root Directory: `backend`
- Serviço do **frontend** → Root Directory: vazio/raiz (o projeto Angular já vive na raiz do repo)

Além disso, é possível configurar *build filters* para que um push que só mude `backend/` não dispare redeploy do frontend, e vice-versa — isso já está pronto no [`render.yaml`](../render.yaml) (chave `buildFilter`). Referência oficial: [Render — Monorepo Support](https://render.com/docs/monorepo-support).

> **Recomendação:** use o arquivo [`render.yaml`](../render.yaml) na raiz do repo (Blueprint) em vez de configurar cada serviço manualmente pelo dashboard — ele já define `rootDir`, `dockerfilePath`, `dockerContext` e `buildFilter` corretamente para os dois serviços. Basta ir em **New** → **Blueprint** e apontar para o repositório.

---

## Deploy no Render (Passo a Passo)

> As instruções abaixo mostram a configuração manual via dashboard. Se preferir usar o Blueprint (`render.yaml`), pule direto para "Deploy via Blueprint" ao final desta seção.

### 1. Criar conta no Render

1. Acesse [render.com](https://render.com)
2. Faça login com GitHub

### 2. Criar PostgreSQL Database

1. Dashboard → **New** → **PostgreSQL**
2. Configure:
   - Name: `duomusic-db`
   - Database: `duomusic`
   - User: `duomusic_user`
   - Region: Oregon (ou mais próxima)
   - Plan: **Free** (para começar)
3. Clique em **Create Database**
4. Copie a **Internal Database URL** (usaremos depois)

### 3. Criar Web Service (Backend)

1. Dashboard → **New** → **Web Service**
2. Conecte seu repositório GitHub (o mesmo repositório do monorepo)
3. Configure:
   - Name: `duomusic-api`
   - Region: Oregon (mesma do banco)
   - Branch: `main`
   - Root Directory: `backend` (isola o build para essa pasta — o frontend fica de fora)
   - Runtime: **Docker**
   - Dockerfile Path: `./Dockerfile` (relativo ao Root Directory, ou seja, `backend/Dockerfile`)
   - Plan: **Free** (ou Starter para produção)

4. **Environment Variables** (clique em "Advanced"):

```
DUOMUSIC_DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname
DUOMUSIC_JWT_SECRET_KEY=<gerar-chave-segura-32-chars>
DUOMUSIC_DEBUG=false
DUOMUSIC_CORS_ORIGINS=["https://seu-frontend.com"]
DUOMUSIC_LLM_ENABLED=false
DUOMUSIC_LLM_API_KEY=<sua-chave-gemini-se-usar>
```

> **Importante:** Use a Internal Database URL do PostgreSQL criado, mas troque `postgresql://` por `postgresql+asyncpg://`

5. Clique em **Create Web Service**

### 4. Gerar JWT Secret Key Segura

Execute localmente para gerar uma chave segura:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Deploy do Frontend (GitHub Pages)

O frontend é publicado pelo GitHub Pages usando o workflow [`deploy.yml`](../.github/workflows/deploy.yml). O Render hospeda somente o backend e o PostgreSQL.

1. Antes do deploy, confirme a URL da API em `src/environments/environment.production.ts`:

```typescript
export const environment = {
   apiUrl: 'https://duomusic.onrender.com/api',
};
```

2. Em GitHub → **Settings** → **Pages**, configure **Source** como **GitHub Actions**.
3. Faça merge ou push para a branch `main`. O workflow instala as dependências, executa o build com `--base-href /duomusic/` e publica `dist/duomusic/browser` automaticamente.

> A branch `gh-pages` não é usada pelo workflow atual. Ela não deve ser configurada como origem do GitHub Pages nem receber código-fonte manualmente.

### Deploy via Blueprint (alternativa recomendada)

1. Dashboard → **New** → **Blueprint**
2. Conecte o repositório GitHub
3. O Render detecta o `render.yaml` na raiz e propõe criar o serviço `duomusic-api` e o banco `duomusic-db` automaticamente, com o `rootDir` correto
4. Revise as variáveis marcadas como `sync: false` (ex: `DUOMUSIC_CORS_ORIGINS`) e preencha manualmente após o primeiro deploy
5. Clique em **Apply**

---

## Variáveis de Ambiente de Produção

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DUOMUSIC_DATABASE_URL` | URL do PostgreSQL (async) | `postgresql+asyncpg://user:pass@host/db` |
| `DUOMUSIC_JWT_SECRET_KEY` | Chave secreta para JWT (min 32 chars) | `sua-chave-super-secreta-aqui-123` |
| `DUOMUSIC_JWT_ALGORITHM` | Algoritmo JWT | `HS256` (padrão) |
| `DUOMUSIC_JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Expiração do access token | `30` (padrão) |
| `DUOMUSIC_JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Expiração do refresh token | `7` (padrão) |
| `DUOMUSIC_DEBUG` | Modo debug | `false` (produção) |
| `DUOMUSIC_CORS_ORIGINS` | Lista de origens permitidas | `["https://app.duomusic.com"]` |
| `DUOMUSIC_LLM_ENABLED` | Habilitar geração por LLM | `true` ou `false` |
| `DUOMUSIC_LLM_PROVIDER` | Provedor LLM | `gemini` |
| `DUOMUSIC_LLM_API_KEY` | Chave da API do LLM | `AIza...` |
| `DUOMUSIC_LLM_MODEL` | Modelo LLM | `gemini-3.6-flash` |
| `DUOMUSIC_RATE_LIMIT_MAX` | Máximo de requests por janela | `60` (padrão) |
| `DUOMUSIC_RATE_LIMIT_WINDOW` | Janela de rate limit (segundos) | `60` (padrão) |

---

## Checklist de Segurança para Produção

- [ ] JWT_SECRET_KEY gerada com `secrets.token_urlsafe(32)`
- [ ] DEBUG=false
- [ ] CORS_ORIGINS contém apenas domínios autorizados
- [ ] PostgreSQL com senha forte
- [ ] HTTPS habilitado (automático nos provedores)
- [ ] Backup do banco configurado
- [ ] Monitoramento de erros (Sentry, etc.)

---

## Migrations com Alembic

Após o primeiro deploy, rode as migrations:

```bash
# No Render: via Shell no dashboard

alembic upgrade head
```

**Nota:** O backend atualmente cria tabelas automaticamente no startup (`init_db()`). Para produção, considere usar apenas Alembic migrations.

---

## Troubleshooting

### Erro de conexão com banco

Verifique se a URL usa o driver correto:
- ❌ `postgresql://...`
- ✅ `postgresql+asyncpg://...`

### Container não inicia

Verifique os logs no dashboard do provedor. Causas comuns:
- Variáveis de ambiente faltando
- Porta incorreta (use `$PORT`)

### CORS bloqueando requests

Certifique-se de que `DUOMUSIC_CORS_ORIGINS` inclui a URL exata do frontend (com `https://`).

### Rate limit muito restritivo

Ajuste `DUOMUSIC_RATE_LIMIT_MAX` e `DUOMUSIC_RATE_LIMIT_WINDOW` conforme necessário.

---

## Custos Estimados (Mensal)

| Componente | Render Free | Render Starter |
|------------|-------------|----------------|
| Backend | US$0 | US$7 |
| PostgreSQL | US$0 (90 dias) | US$7 |
| Frontend | US$0 | US$0 |
| **Total** | **US$0** | **US$14** |

> **Nota:** O free tier do Render coloca o serviço em "sleep" após 15 minutos de inatividade. O primeiro request pode demorar ~30s para "acordar".

---

## Preparando a Migração Futura para Locaweb

Esta seção documenta o que precisa mudar quando a aplicação for migrada do Render para a Locaweb. **Nenhuma ação é necessária agora** — é um guia de referência para quando a migração acontecer.

### Diferença de modelo: PaaS (Render) vs. IaaS (Locaweb)

| | Render (atual) | Locaweb (futuro) |
|---|---|---|
| Modelo | PaaS — builda o Dockerfile automaticamente a cada push | IaaS — você provisiona a VM e roda o Docker manualmente |
| Build | Automático via GitHub | Manual (`docker build` / `docker compose up` na VM) |
| SSL/HTTPS | Automático | Configurar Nginx + Certbot (Let's Encrypt) |
| Proxy reverso | Gerenciado pelo Render | Você mesmo instala (Nginx/Traefik) |
| Banco gerenciado | PostgreSQL managed incluso | Contratar banco gerenciado à parte, ou rodar em container na mesma VM |

### O que já está pronto para a migração

O [`backend/Dockerfile`](../backend/Dockerfile) já é **agnóstico de provedor** — não depende de nenhuma feature específica do Render:

- Usa a variável `$PORT` (configurável, não fixa em 8000)
- Roda como usuário não-root
- Tem `HEALTHCHECK` embutido (útil para orquestração via `docker compose` ou watchdog)
- `docker-entrypoint.sh` normaliza a `DATABASE_URL` para o driver `asyncpg`

Ou seja, a mesma imagem Docker que roda no Render pode rodar em qualquer VM Linux com Docker instalado, sem alterações no Dockerfile.

### Passos previstos para a migração

1. **Provisionar a VM** (Locaweb Cloud ou VPS Locaweb), com Ubuntu/Debian recente e Docker + Docker Compose instalados
2. **Clonar o repositório** na VM (ou configurar um pipeline de CI/CD que faça `git pull` + `docker build`)
3. **Criar um `docker-compose.yml`** de produção na VM (não versionado neste guia ainda, pois depende da topologia final — ex: se o PostgreSQL vai rodar em container ou será um serviço gerenciado à parte)
4. **Configurar reverse proxy** (Nginx ou Traefik) na frente do container para:
   - Terminar SSL/TLS (via Certbot/Let's Encrypt)
   - Rotear `api.duomusic.com.br` → container do backend na porta interna
5. **Migrar o banco de dados**: `pg_dump` do PostgreSQL do Render → `pg_restore` no banco de destino (gerenciado pela Locaweb ou em container)
6. **Atualizar variáveis de ambiente**: `DUOMUSIC_DATABASE_URL`, `DUOMUSIC_CORS_ORIGINS` (novo domínio), `DUOMUSIC_JWT_SECRET_KEY` (manter a mesma para não invalidar tokens existentes, se a migração for feita sem downtime)
7. **Atualizar o frontend**: `src/environments/environment.production.ts` com a nova URL da API e rebuild
8. **Trocar o DNS** do domínio da API para apontar para o novo IP/VM, com um período de transição se possível

### O que pedir ao Copilot quando a migração for iniciada

Quando decidir seguir com a migração, peça para gerar:
- Um `docker-compose.yml` de produção (backend + Nginx + Certbot, e opcionalmente PostgreSQL)
- Um arquivo de configuração do Nginx com proxy reverso e redirecionamento HTTPS
- Um script de deploy (`git pull && docker compose up -d --build`) para rodar na VM
