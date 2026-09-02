from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables (see .env.example)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Scopewise"
    app_env: str = "development"  # development | production

    # Database URL. SQLite by default for local dev (zero-cost);
    # set DATABASE_URL to a Postgres URL in production.
    database_url: str = "sqlite:///./scopewise.db"

    # JWT signing secret. MUST be set to a long random value in production.
    secret_key: str = "dev-only-change-me-please"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS — comma-separated list of allowed origins for production.
    cors_origins: str = ""  # e.g. "https://user.github.io,https://scopewise.app"

    # Rate limiting
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 60

    # Price per out-of-scope hour (default suggestion, editable per project)
    default_hourly_rate: float = 100.0


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.app_env == "production" and s.secret_key == "dev-only-change-me-please":
        raise RuntimeError(
            "SECRET_KEY must be set to a secure random value in production. "
            "Set the SECRET_KEY environment variable."
        )
    return s
