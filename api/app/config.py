from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    grok_api_key: str
    grok_model: str = "grok-beta"  # or grok-2, etc.
    max_iterations: int = 10
    default_workspace: str = "../workspaces/default-project"

    model_config = {"env_file": ".env"}

settings = Settings()