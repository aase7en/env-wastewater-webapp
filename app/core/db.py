"""Database engine, session factory, and declarative base.

SQLAlchemy 2.0 async against Supabase Postgres via asyncpg. Connection string
comes from settings.supabase_db_url.

Note on pooler mode: Supabase's transaction-mode pooler (port 6543) does not
support prepared statements reliably, so we disable them via asyncpg connect
args (statement_cache_size=0). Session-mode pooler (port 5432) would not need
this, but transaction mode is what serverless/Cloud Run wants.
"""
from __future__ import annotations

from functools import lru_cache
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


@lru_cache
def _engine():
    """Build the async engine lazily on first use.

    Created on demand (not at module import) so importing the package — and
    booting uvicorn for a /health probe — does not require a valid DB url.
    """
    s = get_settings()
    return create_async_engine(
        s.supabase_db_url,
        echo=s.is_dev,
        pool_pre_ping=True,
        # asyncpg connect args — disable prepared-statement caching for Supabase
        # transaction-mode pooler (port 6543).
        connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0},
    )


@lru_cache
def SessionLocal() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        _engine(),
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a DB session, rolls back on exception."""
    async with SessionLocal()() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
