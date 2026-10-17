from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional
import os


class Settings(BaseSettings):
    APP_ENV: str = Field(default="development")
    API_BASE_URL: str = Field(default="http://localhost:8000")
    FRONTEND_URL: str = Field(default="http://localhost:8081")

    # Database - absolute path so regardless of working directory, same db is used
    _backend_dir: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATABASE_URL: str = Field(default=f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'evsmith.db')}")

    # JWT
    JWT_SECRET_KEY: str = Field(default="evsmith_super_secure_jwt_secret_change_in_production_2026_xyz")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=30)

    # Bravo OTP
    BRAVO_API_KEY: Optional[str] = Field(default=None)
    BRAVO_API_URL: str = Field(default="https://api.bravo.io/v1/send-otp")
    BRAVO_EMAIL_TEMPLATE_ID: str = Field(default="evsmith_email_otp_template")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: Optional[str] = Field(default=None)
    CLOUDINARY_API_KEY: Optional[str] = Field(default=None)
    CLOUDINARY_API_SECRET: Optional[str] = Field(default=None)
    CLOUDINARY_FOLDER: str = Field(default="evsmith_documents")

    # Seed Admin
    SUPER_ADMIN_EMAIL: str = Field(default="admin@evsmith.com")
    SUPER_ADMIN_PHONE: str = Field(default="9876543210")
    SUPER_ADMIN_PASSWORD: str = Field(default="Admin@EVSmith2026!")

    # Late Return Surcharge Policy
    LATE_RETURN_DAILY_RATE: float = Field(default=100.0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
