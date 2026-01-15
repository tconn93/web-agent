from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    grok_api_key: str
    # IMPORTANT: Use a model that supports function calling
    # Recommended: grok-4-1-fast, grok-4-1-fast-non-reasoning, grok-3-beta
    # DO NOT USE: grok-beta (does not support function calling)
    grok_model: str = "grok-4-1-fast"
    max_iterations: int = 10
    default_workspace: str = "../workspaces/default-project"

    # Token pricing (per million tokens)
    # Default pricing for grok-4-1-fast as of Jan 2026
    input_price: float = 5.0  # $5 per 1M input tokens
    output_price: float = 15.0  # $15 per 1M output tokens

    # Google Search API (optional)
    google_api_key: str | None = None
    google_search_engine_id: str | None = None

    # Database settings
    database_url: str = "postgresql://webagent:webagent@localhost:5432/webagent"
    db_echo: bool = False  # Set to True for SQL query logging

    # JWT Authentication
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    model_config = {"env_file": ".env"}

# Models that support function calling (for validation/warning purposes)
FUNCTION_CALLING_MODELS = [
    "grok-3-beta",
    "grok-3-mini-beta",
    "grok-4",
    "grok-4-fast-reasoning",
    "grok-4-fast-non-reasoning",
    "grok-4-1-fast",
    "grok-4-1-fast-reasoning",
    "grok-4-1-fast-non-reasoning",
    "grok-code-fast-1",
]

settings = Settings()

# Warn if using a model that may not support function calling
if settings.grok_model not in FUNCTION_CALLING_MODELS:
    print(f"⚠️  WARNING: Model '{settings.grok_model}' may not support function calling.")
    print(f"   This may cause 422 errors. Recommended models: {', '.join(FUNCTION_CALLING_MODELS[:3])}")
    print(f"   See https://docs.x.ai/docs/guides/function-calling for supported models.")