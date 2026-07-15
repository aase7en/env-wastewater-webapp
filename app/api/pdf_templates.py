"""PDF template-builder endpoints (CRUD on core.pdf_template).

This is the storage + retrieval half of the template-builder module. Actual
PDF *rendering* (data → PDF bytes) is a separate chunk — the engine that
reads layout JSON + a data source and emits a printable file lands later.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.db import get_session
from app.core.dependencies import current_user, require_admin
from app.models.pdf_template import PdfTemplate
from app.schemas.pdf_template import PdfTemplateCreate, PdfTemplateOut

router = APIRouter(prefix="/api/pdf-templates", tags=["pdf-templates"])


@router.get("", response_model=list[PdfTemplateOut])
async def list_templates(
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> list[PdfTemplate]:
    rows = (await session.execute(select(PdfTemplate).order_by(PdfTemplate.name))).scalars().all()
    return rows


@router.post("", response_model=PdfTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: PdfTemplateCreate,
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> PdfTemplate:
    tpl = PdfTemplate(**payload.model_dump())
    session.add(tpl)
    await session.commit()
    await session.refresh(tpl)
    return tpl


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: UUID,
    session: AsyncSession = Depends(get_session),
    _admin: CurrentUser = Depends(require_admin),
) -> None:
    """Only admins delete templates (protects builtin starter templates)."""
    row = await session.get(PdfTemplate, template_id)
    if row is None:
        raise HTTPException(status_code=404, detail="template not found")
    await session.delete(row)
    await session.commit()
