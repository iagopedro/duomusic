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

### 🚀 Alternativa 1: Railway (railway.app)

**Por quê?**
- Região São Paulo disponível (menor latência)
- US$5 de crédito grátis/mês
- Deploy muito simples
- PostgreSQL incluído

**Custos:**
- Hobby: US$5/mês inclusos
- Pro: US$20/mês + uso

---

### 🌐 Alternativa 2: Fly.io (fly.io)

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

## Monorepo: backend e frontend no mesmo repositório

**Não é necessário criar um repositório separado.** O Render (e o Railway) têm suporte nativo a monorepos: cada serviço aponta para o mesmo repositório GitHub, mas define seu próprio **Root Directory** (pasta raiz). Só os arquivos dentro dessa pasta são usados no build/deploy daquele serviço.

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

### 5. Deploy do Frontend (Static Site)

1. Dashboard → **New** → **Static Site**
2. Conecte o repositório
3. Configure:
   - Name: `duomusic-app`
   - Branch: `main`
   - Build Command: `npm install && npm run build -- --configuration=production`
   - Publish Directory: `dist/duomusic/browser`

4. **Environment Variables**:
   - Não são necessárias (a URL da API está no build)

5. **Antes do deploy**, atualize `src/environments/environment.production.ts`:

```typescript
export const environment = {
  apiUrl: 'https://duomusic-api.onrender.com/api',
};
```

> O Root Directory do frontend deve ficar **vazio** (raiz do repo) — não configure `backend` aqui.

### Deploy via Blueprint (alternativa recomendada)

1. Dashboard → **New** → **Blueprint**
2. Conecte o repositório GitHub
3. O Render detecta o `render.yaml` na raiz e propõe criar os serviços `duomusic-api`, `duomusic-app` e o banco `duomusic-db` automaticamente, cada um já com o `rootDir` correto
4. Revise as variáveis marcadas como `sync: false` (ex: `DUOMUSIC_CORS_ORIGINS`) e preencha manualmente após o primeiro deploy
5. Clique em **Apply**

---

## Deploy no Railway (Passo a Passo)

### 1. Criar conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub

### 2. Criar Projeto

1. Clique em **New Project**
2. Selecione **Deploy from GitHub repo**
3. Escolha o repositório `duomusic`

### 3. Adicionar PostgreSQL

1. No projeto, clique em **New** → **Database** → **PostgreSQL**
2. O Railway cria automaticamente a variável `DATABASE_URL`

### 4. Configurar Backend

1. Clique no serviço do backend
2. **Settings** → **Root Directory**: `backend` (Railway também suporta monorepo dessa forma — o frontend usaria outro serviço com Root Directory vazio)
3. **Variables** → Adicione:

```
DUOMUSIC_DATABASE_URL=${{Postgres.DATABASE_URL}}
DUOMUSIC_JWT_SECRET_KEY=<gerar-chave-segura>
DUOMUSIC_DEBUG=false
DUOMUSIC_CORS_ORIGINS=["https://seu-frontend.up.railway.app"]
```

> **Nota:** Railway usa `${{Postgres.DATABASE_URL}}` para referenciar variáveis de outros serviços.

### 5. Deploy

O Railway faz deploy automaticamente ao detectar o Dockerfile.

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
# No Railway: via terminal do serviço

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

| Componente | Render Free | Render Starter | Railway |
|------------|-------------|----------------|---------|
| Backend | US$0 | US$7 | ~US$5 |
| PostgreSQL | US$0 (90 dias) | US$7 | Incluído |
| Frontend | US$0 | US$0 | Incluído |
| **Total** | **US$0** | **US$14** | **~US$5** |

> **Nota:** O free tier do Render coloca o serviço em "sleep" após 15 minutos de inatividade. O primeiro request pode demorar ~30s para "acordar".
