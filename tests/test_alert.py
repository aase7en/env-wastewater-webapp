"""Unit tests for the threshold alert stub (no DB needed)."""
from __future__ import annotations

from app.core.alert import DO_MIN, FREE_CHLORINE_MIN, PH_MAX, PH_MIN, check_thresholds


def test_no_alerts_when_all_normal():
    alerts = check_thresholds(do_average=4.0, free_chlorine=1.0, ph=7.2)
    assert alerts == []


def test_do_below_threshold():
    alerts = check_thresholds(do_average=1.5, free_chlorine=1.0, ph=7.2)
    assert len(alerts) == 1
    assert alerts[0].field == "do_average"
    assert alerts[0].value < DO_MIN


def test_free_chlorine_below_threshold():
    alerts = check_thresholds(do_average=4.0, free_chlorine=0.2, ph=7.2)
    assert len(alerts) == 1
    assert alerts[0].field == "free_chlorine"
    assert alerts[0].value < FREE_CHLORINE_MIN


def test_ph_out_of_range_high():
    alerts = check_thresholds(do_average=4.0, free_chlorine=1.0, ph=9.0)
    assert len(alerts) == 1
    assert alerts[0].field == "ph"
    assert alerts[0].value > PH_MAX


def test_ph_out_of_range_low():
    alerts = check_thresholds(do_average=4.0, free_chlorine=1.0, ph=5.0)
    assert len(alerts) == 1
    assert alerts[0].value < PH_MIN


def test_multiple_alerts_at_once():
    alerts = check_thresholds(do_average=1.0, free_chlorine=0.1, ph=9.5)
    assert len(alerts) == 3
    fields = {a.field for a in alerts}
    assert fields == {"do_average", "free_chlorine", "ph"}


def test_none_values_are_skipped():
    """Missing measurements never raise an alert — we can't judge what wasn't read."""
    alerts = check_thresholds(do_average=None, free_chlorine=None, ph=None)
    assert alerts == []


def test_boundary_values_are_ok():
    """Exactly on the threshold is NOT an alert (strict <)."""
    alerts = check_thresholds(
        do_average=DO_MIN, free_chlorine=FREE_CHLORINE_MIN, ph=PH_MIN
    )
    assert alerts == []
    alerts = check_thresholds(do_average=DO_MIN, free_chlorine=FREE_CHLORINE_MIN, ph=PH_MAX)
    assert alerts == []
