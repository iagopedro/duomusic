#!/bin/sh
# Script de startup para provedores de cloud
# Ajusta a DATABASE_URL para usar o driver asyncpg

# Se DATABASE_URL existe e não tem o driver asyncpg, adiciona
if [ -n "$DUOMUSIC_DATABASE_URL" ]; then
    # Substitui postgresql:// por postgresql+asyncpg://
    export DUOMUSIC_DATABASE_URL=$(echo "$DUOMUSIC_DATABASE_URL" | sed 's|^postgresql://|postgresql+asyncpg://|')
fi

# Executa o comando passado como argumento
exec "$@"
