"""Unit tests for computed water-quality formulas (no DB needed)."""
from __future__ import annotations

from datetime import date

from app.core.computed import (
    date_thai_be,
    do_average,
    energy_kwh,
    energy_per_m3,
    sv30_percent,
)


class TestDoAverage:
    def test_three_points(self):
        assert do_average(2.0, 4.0, 6.0) == 4.0

    def test_rounds_to_two_decimals(self):
        assert do_average(2.1, 2.2, 2.3) == 2.2

    def test_missing_one_returns_none(self):
        assert do_average(2.0, None, 6.0) is None

    def test_all_none(self):
        assert do_average(None, None, None) is None


class TestEnergyKwh:
    def test_simple_delta(self):
        assert energy_kwh(100.0, 150.0) == 50.0

    def test_negative_is_allowed(self):
        """Meter rollback / data error — return as-is, don't clamp."""
        assert energy_kwh(150.0, 100.0) == -50.0

    def test_missing(self):
        assert energy_kwh(None, 100.0) is None
        assert energy_kwh(100.0, None) is None


class TestSv30Percent:
    def test_typical(self):
        assert sv30_percent(250) == 25.0

    def test_none(self):
        assert sv30_percent(None) is None


class TestEnergyPerM3:
    def test_typical(self):
        assert energy_per_m3(50.0, 100.0) == 0.5

    def test_zero_flow(self):
        assert energy_per_m3(50.0, 0) is None

    def test_none(self):
        assert energy_per_m3(None, 100.0) is None


class TestDateThaiBe:
    def test_conversion(self):
        assert date_thai_be(date(2026, 7, 16)) == 2569

    def test_none(self):
        assert date_thai_be(None) is None
