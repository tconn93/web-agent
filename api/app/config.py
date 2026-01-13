from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    grok_api_key: str
    grok_model: str = "grok-beta"  # or grok-2, etc.
    max_iterations: int = 10
    default_workspace: str = "../workspaces/default-project"

    # Token pricing (per million tokens)
    input_price: float = 5.0  # $5 per 1M input tokens (default for grok-beta)
    output_price: float = 15.0  # $15 per 1M output tokens (default for grok-beta)

    # Google Search API (optional)
    google_api_key: str | None = None
    google_search_engine_id: str | None = None

    # Database settings
    database_url: str = "postgresql://user:password@localhost:5432/webagent"
    db_echo: bool = False  # Set to True for SQL query logging

    # JWT Authentication
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    model_config = {"env_file": ".env"}

settings = Settings()