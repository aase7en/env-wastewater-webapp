/**
 * ENV-PARITY-P3-006 — the executable Phase-3 fixture suite (lane P3.6, the
 * FINAL Phase-3 lane; the P1.7/P2.6 fixture pattern applied to the five
 * delivered Phase-3 surfaces, WO §2/§3).
 *
 * The suite CONSUMES the delivered pure libs (masters / inventory /
 * calibration / job / manuals / address) against the expected-value corpus
 * in parity-fixtures-p3.ts — never re-derives their math. SQL-semantic
 * cases (sql: true) are exercised by
 * scripts/test_parity_p3_006_fixtures_sql.py (transactional
 * BEGIN…ROLLBACK, zero net persistence); the case ids mirror 1:1
 * (P3_006_SQL_CASE_IDS).
 *
 * Meta-pins (every family): citation completeness (every case cites ref
 * doc 12), id uniqueness, family coverage, SQL-mirror completeness,
 * divergence honesty (every divergence note cites DIVERGENCE_KINDS_P3),
 * and the PII pin (13-digit digit-run scan of the new fixture files = 0;
 * the 12-digit tail of the synthetic uuid fixtures stays under the pin).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CATEGORY_TOKENS,
  EMPTY_DISTRIBUTOR_LABEL,
  EMPTY_ITEM_PICKER_LABEL,
  EMPTY_VENDORS_LABEL,
  buildDistributorPayload,
  buildItemPayload,
  formatItemOption,
  toNullableNumber,
  toNullableText,
} from "./masters";
import {
  CHLORINE_LEGACY_ITEM_ID,
  SOURCE_WASTEWATER,
  chlorineUsedReal,
  deductForReading,
  fefoOrder,
  formatDeductionBadge,
  buildLotPayload,
  type DeductionResult,
  type InventoryLotRow,
} from "./inventory";
import {
  EMPTY_CALIBRATIONS_LABEL,
  NEXT_DUE_PINNED_ABSENT,
  buildCalibrationPayload,
  latestByTool,
  todayISO,
  type ToolCalibrationSummary,
} from "./calibration";
import { toLocalISODate } from "./utils";
import {
  DISPLAY_CHECK_LIMIT_KM,
  EMPTY_JOBS_LABEL,
  ERR_GEOFENCE,
  ERR_QR,
  GEOFENCE_LIMIT_KM,
  HOSPITAL_PIN,
  QR_PLACEHOLDER,
  WORKING_OPTIONS,
  WORKING_SEPARATOR,
  buildJobPayload,
  geofenceVerdict,
  haversineKm,
  isEligiblePractician,
  isQrPayloadUsable,
  joinWorking,
} from "./job";
import {
  EMPTY_WATER_SUPPLY_LABEL,
  LEGACY_DRIVE_NOTE,
  MANUAL_DOMAIN_LABELS,
  MANUAL_TABLES,
  buildManualPayload,
  fileLinkKind,
  isAbsoluteHttpUrl,
} from "./manuals";
import {
  ADDRESS_PAGE_SIZE,
  ADDRESS_PHASE4_NOTE,
  addressKey,
  buildAddressPayload,
  coerceAddressInt,
  filterAddressRows,
  paginateAddressRows,
} from "./address";
import {
  ADDRESS_KEY_CASES,
  ADDRESS_PAYLOAD_CASES,
  ADDRESS_SEARCH_CASES,
  ALL_P3_CASES,
  CALIBRATION_GROUP_CASES,
  CALIBRATION_PAYLOAD_CASES,
  CALIBRATION_PIN_CASES,
  DIVERGENCE_KINDS_P3,
  INVENTORY_BADGE_CASES,
  INVENTORY_FEFO_CASES,
  INVENTORY_LOT_PAYLOAD_CASES,
  INVENTORY_READING_GATE_CASES,
  INVENTORY_REAL_CASES,
  JOB_GEOFENCE_CASES,
  JOB_PAYLOAD_CASES,
  JOB_PRACTITIONER_CASES,
  JOB_PIN_CASES,
  JOB_QR_GATE_CASES,
  JOB_WORKING_CASES,
  MANUALS_LINK_CASES,
  MANUALS_PAYLOAD_CASES,
  MANUALS_PIN_CASES,
  MASTERS_DISTRIBUTOR_CASES,
  MASTERS_ITEM_PAYLOAD_CASES,
  MASTERS_NULL_CASES,
  MASTERS_PICKER_CASES,
  MASTERS_PIN_CASES,
  P3FAMILIES,
  P3_006_SQL_CASE_IDS,
  type CalibGroupCase,
  type InventoryFefoCase,
  type JobGeofenceCase,
  type JobPayloadCase,
  type MastersItemPayloadCase,
  type MastersNullCase,
} from "./parity-fixtures-p3";

// ─── fixture-data integrity (meta-pins, every family) ──────────────────────

describe("P3 parity fixture tables — citation completeness (WO §2)", () => {
  it("every case carries a non-empty ref citation citing reference doc 12", () => {
    for (const c of ALL_P3_CASES) {
      expect(c.ref.trim().length, `${c.id} ref must be non-empty`).toBeGreaterThan(0);
      expect(c.ref, `${c.id} must cite a reference-12 line (ref …)`).toMatch(/ref ~?\d/);
    }
  });

  it("case ids are unique across all families", () => {
    const ids = ALL_P3_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("family coverage: exactly the five Phase-3 families, all populated", () => {
    expect([...P3FAMILIES]).toEqual([
      "masters",
      "inventory",
      "calibration",
      "job",
      "manuals-address",
    ]);
    for (const f of P3FAMILIES) {
      expect(
        ALL_P3_CASES.some((c) => c.family === f),
        `family ${f} must carry at least one case`
      ).toBe(true);
    }
  });

  it("SQL-mirror completeness: P3_006_SQL_CASE_IDS == the sql:true case ids (1:1)", () => {
    const sqlTableIds = ALL_P3_CASES.filter((c) => c.sql === true).map((c) => c.id);
    expect([...P3_006_SQL_CASE_IDS].sort()).toEqual([...sqlTableIds].sort());
    expect(
      P3_006_SQL_CASE_IDS.every((id) => ALL_P3_CASES.some((c) => c.id === id))
    ).toBe(true);
  });

  it("the SQL battery file mirrors every sql:true case id (file-level cross-pin)", () => {
    const batteryPath = join(
      dirname(__dirname),
      "..",
      "..",
      "scripts",
      "test_parity_p3_006_fixtures_sql.py"
    );
    const src = readFileSync(batteryPath, "utf8");
    for (const id of P3_006_SQL_CASE_IDS) {
      expect(src.includes(`"${id}"`), `battery must pin case ${id}`).toBe(true);
    }
  });

  it("divergence honesty: every divergence note cites a pinned divergence kind", () => {
    const divergent = ALL_P3_CASES.filter((c) => c.divergence !== undefined);
    expect(divergent.length, "the corpus must carry the divergence pins").toBeGreaterThan(0);
    for (const c of divergent) {
      expect(
        DIVERGENCE_KINDS_P3.some((k) => (c.divergence as string).includes(k)),
        `${c.id} divergence must cite one of DIVERGENCE_KINDS_P3`
      ).toBe(true);
    }
  });

  it("PII pin: no 13-digit digit-run anywhere in the new fixture files", () => {
    const files = ["parity-fixtures-p3.ts", "parity-fixtures-p3.test.ts"];
    for (const f of files) {
      const src = readFileSync(join(__dirname, f), "utf8");
      expect(src.match(/\d{13}/), `${f} must carry no 13-digit run`).toBeNull();
    }
  });
});

// ─── family 1 — masters/bindings (P3.1) ────────────────────────────────────

describe("masters family — blanks⇒NULL honesty (§3.29/§3.31/§3.27/§3.15)", () => {
  it.each(MASTERS_NULL_CASES.map((c) => [c.id, c] as const))(
    "%s",
    (_id, c: MastersNullCase) => {
      if (c.input.text !== undefined) {
        expect(toNullableText(c.input.text)).toBe(c.expected.text);
      }
      if (c.input.num !== undefined) {
        if (c.expected.numThrows) {
          expect(() => toNullableNumber(c.input.num)).toThrow(c.expected.numThrows);
        } else {
          expect(toNullableNumber(c.input.num)).toBe(c.expected.num);
        }
      }
    }
  );

  it.each(MASTERS_ITEM_PAYLOAD_CASES.map((c) => [c.id, c] as const))(
    "%s",
    (_id, c: MastersItemPayloadCase) => {
      if (c.expected.throws) {
        expect(() => buildItemPayload(c.input)).toThrow(c.expected.throws);
        return;
      }
      const payload = buildItemPayload(c.input);
      for (const [k, v] of Object.entries(c.expected.payload ?? {})) {
        expect(payload[k as keyof typeof payload], `${c.id} payload.${k}`).toEqual(v);
      }
    }
  );

  it.each(MASTERS_PICKER_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    expect(formatItemOption(c.input)).toBe(c.expected.label);
  });

  it.each(MASTERS_DISTRIBUTOR_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    const payload = buildDistributorPayload(c.input, c.legacyId);
    for (const [k, v] of Object.entries(c.expected)) {
      expect(payload[k as keyof typeof payload], `${c.id} payload.${k}`).toEqual(v);
    }
  });

  it.each(MASTERS_PIN_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (c.expected.categoryTokens) {
      expect(CATEGORY_TOKENS).toEqual(c.expected.categoryTokens);
    }
    if (c.expected.labels) {
      expect(EMPTY_ITEM_PICKER_LABEL).toBe(c.expected.labels.items);
      expect(EMPTY_VENDORS_LABEL).toBe(c.expected.labels.vendors);
      expect(EMPTY_DISTRIBUTOR_LABEL).toBe(c.expected.labels.distributors);
    }
  });
});

// ─── family 2 — inventory FEFO deduction + reversal (P3.2) ─────────────────

describe("inventory family — FEFO order + ÷SWITCH real usage (§3.28; FEFO ENV-new per owner B6)", () => {
  it.each(INVENTORY_FEFO_CASES.map((c) => [c.id, c] as const))(
    "%s",
    (_id, c: InventoryFefoCase) => {
      const ordered = fefoOrder(c.input as InventoryLotRow[]);
      expect(ordered.map((l) => l.id)).toEqual(c.expected.order);
    }
  );

  it.each(INVENTORY_REAL_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    expect(chlorineUsedReal(c.input.used, c.input.ratio)).toBe(c.expected.real);
  });

  it.each(INVENTORY_LOT_PAYLOAD_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (c.expected.throws) {
      expect(() => buildLotPayload(c.input)).toThrow(c.expected.throws);
      return;
    }
    const payload = buildLotPayload(c.input) as Record<string, unknown>;
    for (const [k, v] of Object.entries(c.expected.payload ?? {})) {
      expect(payload[k], `${c.id} payload.${k}`).toEqual(v);
    }
    if (c.expected.exactKeys) {
      expect(Object.keys(payload).sort()).toEqual([...c.expected.exactKeys].sort());
    }
  });

  it.each(INVENTORY_BADGE_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    const badge = formatDeductionBadge(c.input as DeductionResult);
    expect(badge).toBe(c.expected.text);
    // The variant rule rides the structured status (D5 P3-4): ONLY a clean
    // full deduction is a success outcome — asserted per status below.
    const variant = c.input.status === "deducted" ? "success" : "warning";
    expect(variant).toBe(c.expected.variant);
  });

  it.each(INVENTORY_READING_GATE_CASES.map((c) => [c.id, c] as const))("%s", async (_id, c) => {
    const badge = await deductForReading({
      readingId: "22222222-2222-4222-8222-222222222222",
      chlorineUsed: c.input.used,
      mixRatio: c.input.ratio,
    });
    const exp = c.expected.badge;
    if (exp === null) {
      expect(badge).toBeNull();
    } else {
      expect(badge?.variant).toBe(exp.variant);
      expect(badge?.text).toBe(exp.text);
    }
  });

  it("the deduction anchor is the verbatim ref-6014 constant and the source table pin", () => {
    expect(CHLORINE_LEGACY_ITEM_ID).toBe("0c0e6a47");
    expect(SOURCE_WASTEWATER).toBe("wastewater.reading");
  });
});

// ─── family 3 — calibration incl. NEXT_DUE_ABSENT (P3.3) ───────────────────

describe("calibration family — NEXT_DUE_PINNED_ABSENT + ครั้งล่าสุด grouping (§3.30)", () => {
  it.each(CALIBRATION_PAYLOAD_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (c.expected.throws) {
      expect(() => buildCalibrationPayload(c.input)).toThrow(c.expected.throws);
      return;
    }
    const payload = buildCalibrationPayload(c.input);
    if (c.expected.todayDefault) {
      expect(payload.calibration_date).toBe(toLocalISODate());
    }
    for (const [k, v] of Object.entries(c.expected.payload ?? {})) {
      expect(payload[k], `${c.id} payload.${k}`).toEqual(v);
    }
  });

  it.each(CALIBRATION_GROUP_CASES.map((c) => [c.id, c] as const))(
    "%s",
    (_id, c: CalibGroupCase) => {
      const groups: ToolCalibrationSummary[] = latestByTool(c.input);
      expect(groups.map((g) => [g.key, g.latest_date, g.count])).toEqual(c.expected.groups);
    }
  );

  it.each(CALIBRATION_PIN_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (c.expected.nextDuePinnedAbsent !== undefined) {
      expect(NEXT_DUE_PINNED_ABSENT).toBe(c.expected.nextDuePinnedAbsent);
    }
    if (c.expected.summaryHasNoNextDueField !== undefined) {
      const rows = CALIBRATION_GROUP_CASES[0].input;
      const groups = latestByTool(rows);
      expect(groups.length).toBeGreaterThan(0);
      expect(
        Object.keys(groups[0]).some((k) => k.toLowerCase().includes("next")),
        "no next-due field may exist on the ครั้งล่าสุด summary"
      ).toBe(false);
    }
    if (c.expected.todayIsoMatchesLocalUtil !== undefined) {
      expect(todayISO()).toBe(toLocalISODate());
    }
    if (c.expected.emptyLabel !== undefined) {
      expect(EMPTY_CALIBRATIONS_LABEL).toBe(c.expected.emptyLabel);
    }
  });
});

// ─── family 4 — job geofence/QR incl. the 0.7-vs-2 divergence (P3.4) ───────

describe("job family — geofence verdicts + QR gates + PII resolution (§3.24)", () => {
  it.each(JOB_PIN_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (c.expected.hospitalPin) {
      expect(HOSPITAL_PIN).toEqual(c.expected.hospitalPin);
    }
    if (c.expected.geofenceLimitKm !== undefined) {
      expect(GEOFENCE_LIMIT_KM).toBe(c.expected.geofenceLimitKm);
    }
    if (c.expected.displayCheckLimitKm !== undefined) {
      expect(DISPLAY_CHECK_LIMIT_KM).toBe(c.expected.displayCheckLimitKm);
    }
    if (c.expected.qrPlaceholder !== undefined) {
      expect(QR_PLACEHOLDER).toBe(c.expected.qrPlaceholder);
    }
    if (c.expected.errGeofence !== undefined) {
      expect(ERR_GEOFENCE).toBe(c.expected.errGeofence);
    }
    if (c.expected.errQrSubstrings) {
      for (const s of c.expected.errQrSubstrings) {
        expect(ERR_QR.includes(s), `ERR_QR must carry the verbatim poem arm "${s}"`).toBe(true);
      }
    }
    if (c.expected.workingOptions) {
      expect(WORKING_OPTIONS).toEqual(c.expected.workingOptions);
    }
    if (c.expected.workingSeparator !== undefined) {
      expect(WORKING_SEPARATOR).toBe(c.expected.workingSeparator);
    }
    if (c.expected.emptyLabel !== undefined) {
      expect(EMPTY_JOBS_LABEL).toBe(c.expected.emptyLabel);
    }
  });

  it.each(JOB_GEOFENCE_CASES.map((c) => [c.id, c] as const))(
    "%s",
    (_id, c: JobGeofenceCase) => {
      const v = geofenceVerdict(c.input.lat, c.input.lng);
      expect(v.ok).toBe(c.expected.ok);
      if (c.expected.error !== undefined) {
        expect(v.error).toBe(c.expected.error);
      } else {
        expect(v.error).toBeNull();
      }
      if (typeof c.expected.distanceKm === "number") {
        expect(v.distanceKm).not.toBeNull();
        expect(v.distanceKm as number).toBeCloseTo(c.expected.distanceKm, c.expected.decimals ?? 5);
      } else {
        expect(v.distanceKm).toBeNull();
      }
    }
  );

  it("the haversine helper agrees with the hand-computed pure-north relation d = R·Δφ", () => {
    // Due-north displacement: dLng = 0 kills the cos term, and
    // 2·asin(sin(Δφ/2)) = Δφ exactly — the fixture latitudes in
    // JOB_GEOFENCE_CASES are hand-derived from this identity
    // (deg/km = 180/(π·R) = 8.993218e-3 at R = 6371.0088).
    const d = haversineKm(
      14.361183,
      100.645474,
      14.361183 + 0.69 * (180 / (6371.0088 * Math.PI)),
      100.645474
    );
    expect(d).toBeCloseTo(0.69, 5);
  });

  it.each(JOB_QR_GATE_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    expect(isQrPayloadUsable(c.input)).toBe(c.expected.usable);
  });

  it.each(JOB_PAYLOAD_CASES.map((c) => [c.id, c] as const))(
    "%s",
    (_id, c: JobPayloadCase) => {
      if (c.expected.throws) {
        // The corpus may cite a delivered verbatim constant by symbol
        // (ERR_QR / ERR_GEOFENCE) — resolved here, never re-typed.
        const expectedMsg =
          c.expected.throws === "ERR_QR"
            ? ERR_QR
            : c.expected.throws === "ERR_GEOFENCE"
              ? ERR_GEOFENCE
              : c.expected.throws;
        expect(() => buildJobPayload(c.input)).toThrow(expectedMsg);
        return;
      }
      const payload = buildJobPayload(c.input);
      for (const [k, v] of Object.entries(c.expected.payload ?? {})) {
        expect(payload[k], `${c.id} payload.${k}`).toEqual(v);
      }
      if (c.expected.isoShapeKeys) {
        for (const k of c.expected.isoShapeKeys) {
          expect(String(payload[k])).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }
      }
      if (c.expected.exactKeys) {
        expect(Object.keys(payload).sort()).toEqual([...c.expected.exactKeys].sort());
      }
    }
  );

  it.each(JOB_WORKING_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    expect(joinWorking(c.input)).toBe(c.expected.joined);
  });

  it.each(JOB_PRACTITIONER_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    expect(isEligiblePractician(c.input)).toBe(c.expected.eligible);
  });
});

// ─── family 5 — manuals/address incl. Address_Key-never-stored (P3.5) ──────

describe("manuals family — link-only metadata + the link-display predicate (§3.22/§3.26)", () => {
  it.each(MANUALS_LINK_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    expect(isAbsoluteHttpUrl(c.input)).toBe(c.expected.absolute);
    expect(fileLinkKind(c.input)).toBe(c.expected.kind);
  });

  it.each(MANUALS_PAYLOAD_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (c.expected.throws) {
      expect(() => buildManualPayload(c.input)).toThrow(c.expected.throws);
      return;
    }
    const payload = buildManualPayload(c.input);
    for (const [k, v] of Object.entries(c.expected.payload ?? {})) {
      expect(payload[k], `${c.id} payload.${k}`).toEqual(v);
    }
  });

  it.each(MANUALS_PIN_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (c.expected.tables) {
      expect(MANUAL_TABLES).toEqual(c.expected.tables);
    }
    if (c.expected.domainLabels) {
      expect(MANUAL_DOMAIN_LABELS).toEqual(c.expected.domainLabels);
    }
    if (c.expected.emptyWaterSupplyLabel !== undefined) {
      expect(EMPTY_WATER_SUPPLY_LABEL).toBe(c.expected.emptyWaterSupplyLabel);
    }
    if (c.expected.legacyDriveNote !== undefined) {
      expect(LEGACY_DRIVE_NOTE).toBe(c.expected.legacyDriveNote);
    }
  });
});

describe("address family — Address_Key display-time only + census helpers (§3.6)", () => {
  it.each(ADDRESS_KEY_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    expect(addressKey(c.input)).toBe(c.expected.key);
  });

  it.each(ADDRESS_PAYLOAD_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (c.expected.throws) {
      expect(() => buildAddressPayload(c.input)).toThrow(c.expected.throws);
      return;
    }
    const payload = buildAddressPayload(c.input);
    for (const [k, v] of Object.entries(c.expected.payload ?? {})) {
      expect(payload[k], `${c.id} payload.${k}`).toEqual(v);
    }
    if (c.expected.neverCarriesAddressKey) {
      expect(
        Object.keys(payload).some((k) => k.toLowerCase().includes("address_key")),
        "the §3.6 virtual must NEVER ride the payload"
      ).toBe(false);
    }
  });

  it("coerceAddressInt hand-computed classes (the P2.3 float-id lesson)", () => {
    expect(coerceAddressInt(910104.0)).toBe(910104);
    expect(coerceAddressInt("100101")).toBe(100101);
    expect(() => coerceAddressInt(910104.5)).toThrow("ค่ารหัสต้องเป็นจำนวนเต็ม");
    expect(() => coerceAddressInt("abc")).toThrow("ค่ารหัสไม่ใช่ตัวเลข");
    expect(() => coerceAddressInt("")).toThrow("ค่ารหัสเป็นช่องบังคับกรอก");
    expect(() => coerceAddressInt(null)).toThrow("ค่ารหัสเป็นช่องบังคับกรอก");
  });

  it.each(ADDRESS_SEARCH_CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (c.expected.filteredIds) {
      expect(
        filterAddressRows(c.input.rows ?? [], c.input.query ?? "").map((r) => r.tambon_id)
      ).toEqual(c.expected.filteredIds);
    }
    if (c.expected.pageIds) {
      expect(
        paginateAddressRows(
          c.input.rows ?? [],
          c.input.page as number,
          c.input.size as number
        ).map((r) => r.tambon_id)
      ).toEqual(c.expected.pageIds);
    }
    if (c.expected.pageSize !== undefined) {
      expect(ADDRESS_PAGE_SIZE).toBe(c.expected.pageSize);
    }
    if (c.expected.phase4Note !== undefined) {
      expect(ADDRESS_PHASE4_NOTE).toBe(c.expected.phase4Note);
    }
  });
});
