import json
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AEGIS — Adaptive Emergency Geospatial Intelligence System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres.mllkzsqtbvglgtrqmoqk:hiiampiyushsharma15aug@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require",
        description="PostGIS Database Connection URI"
    )
    CORS_ORIGINS: list[str] = ["*"]
    GEMINI_API_KEY: str | None = None
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
