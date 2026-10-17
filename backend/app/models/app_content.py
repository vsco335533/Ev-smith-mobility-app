from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from app.core.database import Base


class AppContent(Base):
    __tablename__ = "app_content"

    id = Column(Integer, primary_key=True, index=True)
    page_key = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=True)
    subtitle = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    content_data = Column(JSON, nullable=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
