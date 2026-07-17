"""Schema + model sanity tests (no DB)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.schemas.reading import ReadingCreate, ReadingUpdate


class TestReadingCreate:
    def _base_kwargs(self) -> dict:
        return {
            "reading_date": "2026-07-16",
            "ph": "7.2",
            "do_aeration": "4.5",
            "do_sedimentation": "3.1",
            "do_before_discharge": "4.0",
            "system_operating": True,
        }

    def test_minimal_valid(self):
        r = ReadingCreate(**self._base_kwargs())
        assert r.reading_date == date(2026, 7, 16)
        assert r.ph == Decimal("7.2")

    def test_cause_required_when_abnormal(self):
        """SPEC §6: setting system_operating=False without abnormal_cause must fail."""
        kwargs = self._base_kwargs()
        kwargs["system_operating"] = False
        with pytest.raises(ValueError, match="abnormal_cause"):
            ReadingCreate(**kwargs)

    def test_abnormal_with_cause_ok(self):
        kwargs = self._base_kwargs()
        kwargs["system_operating"] = False
        kwargs["abnormal_cause"] = "ปั๊ม 1 น้ำรั่ว"
        r = ReadingCreate(**kwargs)
        assert r.abnormal_cause == "ปั๊ม 1 น้ำรั่ว"

    def test_cause_not_required_when_normal(self):
        kwargs = self._base_kwargs()
        kwargs["system_operating"] = True
        # no abnormal_cause — fine
        r = ReadingCreate(**kwargs)
        assert r.abnormal_cause is None

    def test_whitespace_cause_rejected(self):
        kwargs = self._base_kwargs()
        kwargs["system_operating"] = False
        kwargs["abnormal_cause"] = "   "
        with pytest.raises(ValueError, match="abnormal_cause"):
            ReadingCreate(**kwargs)


class TestReadingUpdate:
    def test_partial_update(self):
        u = ReadingUpdate(ph="7.5")
        assert u.ph == Decimal("7.5")
        assert u.note is None

    def test_abnormal_requires_cause(self):
        with pytest.raises(ValueError, match="abnormal_cause"):
            ReadingUpdate(system_operating=False)

    def test_abnormal_with_cause(self):
        u = ReadingUpdate(system_operating=False, abnormal_cause="เสีย")
        assert u.abnormal_cause == "เสีย"


class TestModelsImport:
    """Guard against model import drift — every model should be importable."""

    def test_all_models_importable(self):
        from app import models
        names = models.__all__
        assert len(names) == 11
        for n in names:
            assert hasattr(models, n), f"{n} missing from models package"

    def test_schemas_importable(self):
        from app import schemas
        # Should not raise.
        assert schemas.ReadingCreate
        assert schemas.ReadingDetail
        assert schemas.DashboardRow
        assert schemas.MonthlySummary
