"""Utilitários de segurança para proteção contra prompt injection e outras vulnerabilidades."""

import re
from typing import Final

# Whitelist de módulos válidos — única fonte de verdade para validação
ALLOWED_MODULE_IDS: Final[frozenset[str]] = frozenset({
    "fundamentals",
    "intervals",
    "scales",
    "chords",
    "mixed",
})

# Padrão para IDs válidos: alfanumérico com hífens, sem caracteres especiais
_SAFE_ID_PATTERN: Final[re.Pattern[str]] = re.compile(r"^[a-zA-Z0-9_-]{1,50}$")


class PromptInjectionError(ValueError):
    """Erro lançado quando entrada potencialmente maliciosa é detectada."""

    pass


def validate_module_id(module_id: str) -> str:
    """
    Valida e sanitiza um module_id contra prompt injection.

    Args:
        module_id: ID do módulo fornecido pelo usuário.

    Returns:
        O module_id validado (em lowercase).

    Raises:
        PromptInjectionError: Se o module_id não estiver na whitelist ou contiver
            caracteres suspeitos.
    """
    if not module_id:
        raise PromptInjectionError("module_id não pode ser vazio")

    # Normaliza para lowercase
    normalized = module_id.strip().lower()

    # Verifica padrão básico (defesa em profundidade)
    if not _SAFE_ID_PATTERN.match(normalized):
        raise PromptInjectionError(
            f"module_id contém caracteres inválidos: {module_id!r}"
        )

    # Verifica contra whitelist
    if normalized not in ALLOWED_MODULE_IDS:
        raise PromptInjectionError(
            f"module_id '{normalized}' não é um módulo válido. "
            f"Valores permitidos: {', '.join(sorted(ALLOWED_MODULE_IDS))}"
        )

    return normalized


def sanitize_for_prompt(value: str, max_length: int = 100) -> str:
    """
    Sanitiza uma string para uso seguro em prompts LLM.

    Remove caracteres que poderiam ser usados para prompt injection:
    - Quebras de linha
    - Caracteres de controle
    - Aspas que poderiam escapar contextos

    Args:
        value: String a ser sanitizada.
        max_length: Comprimento máximo permitido.

    Returns:
        String sanitizada.
    """
    if not value:
        return ""

    # Remove caracteres de controle e quebras de linha
    sanitized = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", value)

    # Remove aspas duplas e simples que poderiam escapar contextos
    sanitized = sanitized.replace('"', "").replace("'", "")

    # Remove backslashes que poderiam escapar caracteres
    sanitized = sanitized.replace("\\", "")

    # Trunca para comprimento máximo
    return sanitized[:max_length].strip()
