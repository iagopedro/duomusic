# ============================================================================
# DuoMusic Backend - Dockerfile
# Multi-stage build otimizado para produção
# ============================================================================

# ---------- Stage 1: Builder ----------
FROM python:3.12-slim AS builder

WORKDIR /build

# Instala dependências de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copia apenas requirements primeiro (cache de camadas)
COPY requirements.txt .

# Cria ambiente virtual e instala dependências
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---------- Stage 2: Runtime ----------
FROM python:3.12-slim AS runtime

WORKDIR /app

# Cria usuário não-root para segurança
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash appuser

# Copia o ambiente virtual do builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copia o script de entrypoint
COPY --chown=appuser:appgroup ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copia o código da aplicação
COPY --chown=appuser:appgroup ./app ./app

# Define variáveis de ambiente padrão
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Expõe a porta (pode ser sobrescrita pelo provedor)
EXPOSE ${PORT}

# Muda para usuário não-root
USER appuser

# Health check para provedores de cloud
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/api/health')" || exit 1

# Entrypoint ajusta variáveis de ambiente (ex: DATABASE_URL)
ENTRYPOINT ["/docker-entrypoint.sh"]

# Comando de inicialização
# Usa $PORT para compatibilidade com Render, Railway, Fly.io, etc.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
