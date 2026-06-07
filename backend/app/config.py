"""
Application configuration using pydantic-settings.
"""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    # Application
    app_name: str = "LLM Stock Trader Trainer"
    app_version: str = "0.1.0"
    debug: bool = True
    environment: str = "development"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    # Additional CORS origins for production, comma-separated
    # e.g. "https://app1.railway.app,https://app2.run.app"
    cors_extra_origin: str = ""

    @property
    def cors_extra_origins(self) -> List[str]:
        if not self.cors_extra_origin:
            return []
        return [o.strip() for o in self.cors_extra_origin.split(",") if o.strip()]

    # Logging
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


# Global settings instance
settings = Settings()
