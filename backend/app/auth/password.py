"""Funções para hash e verificação de senhas usando bcrypt."""

from passlib.context import CryptContext

# Configuração do bcrypt com cost factor adequado
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt 5.x exige truncamento manual para senhas > 72 bytes
_BCRYPT_MAX_LENGTH = 72


def _truncate_password(password: str) -> str:
    """Trunca a senha para o limite de 72 bytes do bcrypt."""
    encoded = password.encode("utf-8")
    if len(encoded) > _BCRYPT_MAX_LENGTH:
        encoded = encoded[:_BCRYPT_MAX_LENGTH]
    return encoded.decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    """
    Gera um hash bcrypt para a senha fornecida.
    
    Args:
        password: Senha em texto plano.
        
    Returns:
        Hash bcrypt da senha.
        
    Note:
        Senhas maiores que 72 bytes são truncadas (limite do bcrypt).
    """
    truncated = _truncate_password(password)
    return pwd_context.hash(truncated)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha em texto plano corresponde ao hash.
    
    Args:
        plain_password: Senha em texto plano.
        hashed_password: Hash bcrypt armazenado.
        
    Returns:
        True se a senha está correta, False caso contrário.
    """
    truncated = _truncate_password(plain_password)
    return pwd_context.verify(truncated, hashed_password)
