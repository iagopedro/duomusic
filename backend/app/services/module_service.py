from ..data.modules import MODULES
from ..models.module import Module


class ModuleService:
    """Serviço de módulos — acesso centralizado aos dados de módulos."""

    def get_all(self) -> list[Module]:
        return list(MODULES)

    def get_by_id(self, module_id: str) -> Module | None:
        return next((m for m in MODULES if m.id == module_id), None)
