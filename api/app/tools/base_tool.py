from abc import ABC, abstractmethod
from pydantic import BaseModel

class Tool(ABC):
    @property
    @abstractmethod
    def schema(self):
        pass

    @abstractmethod
    async def execute(self, arguments: dict) -> str:
        pass