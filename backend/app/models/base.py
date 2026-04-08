from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Modelo base com serialização camelCase para compatibilidade com o frontend Angular."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    def model_dump(self, **kwargs) -> dict:
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)
