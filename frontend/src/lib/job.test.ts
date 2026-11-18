/**
 * ENV-PARITY-P3-004 — unit suite for the job log lib (lane P3.4): the
 * §3.24 verbatim pins + the geofence verdict + form-parity payload rules.
 *
 * Ground truth: reference 12 §3.24 `job` (READ-ONLY doc, ref 4363–4620)
 * — QR_CODE Valid If `AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",[Distance]<=0.7,
 * IN([QR_CODE],location_area[id]))` with the verbatim poem invalid-value
 * error; `location_name` Valid If `distance([uthai_locate],[location])<=0.7`
 * with error `ฮั่นแน่...เข้ามาทำงานก่อน`; the hospital pin
 * LATLONG(14.361183, 100.645474); working EnumList 4 values; practician
 * Valid If = the P1.4 ผู้บันทึก gate verbatim.
 *
 * D2 RED: this suite fails-to-collect while `./job` is absent (the honest
 * new-file RED mode — P1.5/P2.4/P3.1/P3.2/P3.3 precedent).
 */
import { describe, expect, it, vi } from "vitest";
import {
  DISPLAY_CHECK_LIMIT_KM,
  EMPTY_JOBS_LABEL,
  ERR_GEOFENCE,
  ERR_QR,
  ERR_WORKING_REQUIRED,
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
  type JobArea,
} from "./job";

// the lib imports ./supabase (env-gated at module load) — mock it; these
// tests exercise the pure form-parity/geofence surface only.
vi.mock("./supabase", () => ({
  supabase: { from: () => ({ select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) },
}));

const AREA: JobArea = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  legacy_id: "d9423cc0",
  area_name: "ต้นไม้และสนามหญ้า บ่อบำบัด",
  qr_url: null,
  image_ref: null,
  source_provenance: "test",
  created_at: "2026-01-01T00:00:00Z",
};

/** A synthetic in-range point ~13 m from the hospital pin (the shape of the
 * recorded history rows, e.g. "14.361284, 100.645649"). Synthetic test
 * values only — never a real personnel/geolocation identity. */
const NEAR_POINT = { lat: 14.361284, lng: 100.645649 };
/** A synthetic far point (well beyond both the 0.7 and the 2 km bounds). */
const FAR_POINT = { lat: 14.6, lng: 100.9 };

describe("verbatim pins", () => {
  it("carries the 4-value working vocabulary verbatim (§3.24 EnumList)", () => {
    expect([...WORKING_OPTIONS]).toEqual(["รดน้ำ", "ตัดหญ้า", "กวาด", "เก็บขยะ"]);
  });

  it("carries the hospital geofence pin verbatim (uthai_locate LATLONG)", () => {
    expect(HOSPITAL_PIN).toEqual({ lat: 14.361183, lng: 100.645474 });
    expect(GEOFENCE_LIMIT_KM).toBe(0.7);
    // D1-5: the AppSheet virtual-check bound (<=2) is a RECORDED display
    // artifact — never used as the ENV write gate.
    expect(DISPLAY_CHECK_LIMIT_KM).toBe(2);
  });

  it("carries the verbatim Thai errors", () => {
    expect(ERR_GEOFENCE).toBe("ฮั่นแน่...เข้ามาทำงานก่อน");
    expect(ERR_QR).toBe(
      "*ต้องมีอะไรผิดพลาดตรงไหน ไม่เข้าใจเลยสักครั้ง ไอ้ที่เขาทำฉันนั้นก็ทำ แต่ทำและไม่เคยสมหวัง หรืออาจเป็นเพราะพื้นดวงหรือเปล่าหรือเป็นที่ราศีของดวงดาว*"
    );
    expect(QR_PLACEHOLDER).toBe("สแกน QR CODE");
    expect(EMPTY_JOBS_LABEL).toBe("ยังไม่มีรายการงาน");
    expect(WORKING_SEPARATOR).toBe(" , ");
  });
});

describe("haversineKm + geofenceVerdict (server-pinned 0.7 km semantics)", () => {
  it("measures ~0 for the pin itself", () => {
    expect(haversineKm(HOSPITAL_PIN.lat, HOSPITAL_PIN.lng, HOSPITAL_PIN.lat, HOSPITAL_PIN.lng)).toBeCloseTo(0, 6);
  });

  it("measures the synthetic near point well inside 0.7 km", () => {
    const d = haversineKm(NEAR_POINT.lat, NEAR_POINT.lng, HOSPITAL_PIN.lat, HOSPITAL_PIN.lng);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(0.1);
  });

  it("accepts <=0.7 km and rejects >0.7 km with the verbatim error", () => {
    const ok = geofenceVerdict(NEAR_POINT.lat, NEAR_POINT.lng);
    expect(ok.ok).toBe(true);
    expect(ok.distanceKm).toBeLessThanOrEqual(GEOFENCE_LIMIT_KM);
    const bad = geofenceVerdict(FAR_POINT.lat, FAR_POINT.lng);
    expect(bad.ok).toBe(false);
    expect(bad.distanceKm).toBeGreaterThan(GEOFENCE_LIMIT_KM);
    expect(bad.error).toBe(ERR_GEOFENCE);
  });

  it("rejects blank/unknown coordinates — unknown is never a pass (D1-6)", () => {
    expect(geofenceVerdict(null, null).ok).toBe(false);
    expect(geofenceVerdict(null, null).error).toBe(ERR_GEOFENCE);
    expect(geofenceVerdict(Number.NaN, 100).ok).toBe(false);
    expect(geofenceVerdict(14.36, Number.NaN).error).toBe(ERR_GEOFENCE);
  });
});

describe("isQrPayloadUsable (the QR_CODE Valid If usable-value rule)", () => {
  it("rejects the placeholder init and blank payloads verbatim", () => {
    expect(isQrPayloadUsable("")).toBe(false);
    expect(isQrPayloadUsable(null)).toBe(false);
    expect(isQrPayloadUsable("สแกน QR CODE")).toBe(false);
  });

  it("accepts a scanned 8-hex id", () => {
    expect(isQrPayloadUsable("d9423cc0")).toBe(true);
  });
});

describe("joinWorking (the verbatim EnumList storage shape — D1-4 joined text)", () => {
  it("joins with the verbatim ' , ' separator", () => {
    expect(joinWorking(["รดน้ำ", "เก็บขยะ"])).toBe("รดน้ำ , เก็บขยะ");
    expect(joinWorking(["รดน้ำ", "ตัดหญ้า", "กวาด", "เก็บขยะ"])).toBe("รดน้ำ , ตัดหญ้า , กวาด , เก็บขยะ");
  });

  it("returns a single value bare and NULL for empty selections", () => {
    expect(joinWorking(["กวาด"])).toBe("กวาด");
    expect(joinWorking([])).toBeNull();
  });
});

describe("isEligiblePractician (the practician Valid If / P1.4 ผู้บันทึก gate verbatim)", () => {
  it("accepts นักวิชาการสาธารณสุข / พนักงานบริการ with สถานะ = ทำงาน", () => {
    expect(isEligiblePractician({ position: "นักวิชาการสาธารณสุข", status: "ทำงาน" })).toBe(true);
    expect(isEligiblePractician({ position: "พนักงานบริการ", status: "ทำงาน" })).toBe(true);
  });

  it("rejects นายแพทย์ and non-working statuses (blank ⇒ ineligible — unknown ≠ eligible)", () => {
    expect(isEligiblePractician({ position: "นายแพทย์", status: "ทำงาน" })).toBe(false);
    expect(isEligiblePractician({ position: "พนักงานบริการ", status: "ลาออก" })).toBe(false);
    expect(isEligiblePractician({ position: "พนักงานบริการ", status: "ย้ายกลุ่มงาน" })).toBe(false);
    expect(isEligiblePractician({ position: "พนักงานบริการ", status: null })).toBe(false);
    expect(isEligiblePractician({ position: null, status: "ทำงาน" })).toBe(false);
  });
});

describe("buildJobPayload (form parity + honest validations)", () => {
  const base = {
    qrPayload: "d9423cc0",
    area: AREA,
    location: NEAR_POINT,
    working: ["รดน้ำ"] as string[],
    practitionerId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    issue: "",
  };

  it("builds the payload on the happy path (scanned_at now, working joined, issue blank ⇒ NULL)", () => {
    const p = buildJobPayload(base) as Record<string, unknown>;
    expect(p.location_area_id).toBe(AREA.id);
    expect(p.qr_legacy_id).toBe("d9423cc0");
    expect(p.lat).toBeCloseTo(NEAR_POINT.lat, 6);
    expect(p.working).toBe("รดน้ำ");
    expect(p.practitioner_id).toBe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(p.issue).toBeNull();
    expect(typeof p.scanned_at).toBe("string");
    expect(p.source_provenance).toContain("ENV-PARITY-P3-004");
    // the raw payload NEVER carries a legacy practician string (PII pin)
    expect(p).not.toHaveProperty("practitioner_legacy_id_nonnull");
  });

  it("rejects the placeholder QR with the verbatim poem", () => {
    expect(() => buildJobPayload({ ...base, qrPayload: "สแกน QR CODE", area: null })).toThrow(ERR_QR);
  });

  it("rejects a blank QR with the verbatim poem", () => {
    expect(() => buildJobPayload({ ...base, qrPayload: "", area: null })).toThrow(ERR_QR);
  });

  it("rejects an unresolved QR (not in location_area — the IN() Valid If failure) with the poem", () => {
    expect(() => buildJobPayload({ ...base, area: null })).toThrow(ERR_QR);
  });

  it("rejects a missing location honestly — the distance-on-blank Valid If failure", () => {
    expect(() => buildJobPayload({ ...base, location: null })).toThrow(ERR_GEOFENCE);
  });

  it("rejects an out-of-range location with the verbatim error (honest reject, never a silent pass)", () => {
    expect(() => buildJobPayload({ ...base, location: FAR_POINT })).toThrow(ERR_GEOFENCE);
  });

  it("rejects an empty working selection (house-level — never presented as AppSheet)", () => {
    expect(() => buildJobPayload({ ...base, working: [] })).toThrow(ERR_WORKING_REQUIRED);
  });

  it("rejects a missing practitioner (the §3.24 practician column is a Ref — no anonymous recorder)", () => {
    expect(() => buildJobPayload({ ...base, practitionerId: "" })).toThrow();
  });

  it("carries issue text verbatim when provided", () => {
    const p = buildJobPayload({ ...base, issue: "หญ้าบางจุดยาวเกิน" }) as Record<string, unknown>;
    expect(p.issue).toBe("หญ้าบางจุดยาวเกิน");
  });
});
