"""Threshold-based abnormal-value detection (alert stub).

Checks a reading against the thresholds documented in the A-Wiki schema
design doc §Alert Logic. When any threshold is breached, an entry is appended
to the returned list AND logged at WARNING level. Telegram/Line delivery is
deliberately NOT wired here — SPEC.md marks threshold alerts as out-of-v1
scope, and the user picked "threshold + stub" for P5. The list return lets a
future notifier consume the same results without re-checking.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

log = logging.getLogger(__name__)

# Thresholds — source: env-webapp-schema-wastewater.md §Alert Logic.
# do_average (computed from 3 DO points) must be ≥ 2.0 mg/L.
DO_MIN = 2.0
# Free chlorine must be ≥ 0.5 mg/L.
FREE_CHLORINE_MIN = 0.5
# pH must stay within 6.5–8.5.
PH_MIN = 6.5
PH_MAX = 8.5


@dataclass(frozen=True)
class Alert:
    field: str
    value: float
    message: str


def check_thresholds(
    *,
    do_average: Optional[float],
    free_chlorine: Optional[float],
    ph: Optional[float],
) -> list[Alert]:
    """Return alerts for any breached threshold. Logs each at WARNING."""
    alerts: list[Alert] = []

    if do_average is not None and do_average < DO_MIN:
        a = Alert("do_average", do_average, f"⚠️ DO ต่ำกว่า {DO_MIN} mg/L (ค่า: {do_average})")
        alerts.append(a)
    if free_chlorine is not None and free_chlorine < FREE_CHLORINE_MIN:
        a = Alert(
            "free_chlorine",
            free_chlorine,
            f"⚠️ Free Chlorine ต่ำกว่า {FREE_CHLORINE_MIN} mg/L (ค่า: {free_chlorine})",
        )
        alerts.append(a)
    if ph is not None and not (PH_MIN <= ph <= PH_MAX):
        a = Alert("ph", ph, f"⚠️ pH ออกนอกช่วง {PH_MIN}–{PH_MAX} (ค่า: {ph})")
        alerts.append(a)

    for a in alerts:
        log.warning("threshold alert: %s", a)
    return alerts
