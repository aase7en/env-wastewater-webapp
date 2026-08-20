/**
 * WO-STAB-004 — unit tests for the pure form-hydration gate.
 *
 * Covers the four hydration behaviors from the work order's acceptance
 * criteria as pure logic (no DOM rendering needed):
 *   1. initial hydration allowed
 *   2. pristine same-record refresh allowed
 *   3. dirty same-record refresh DENIED (the data-loss bug)
 *   4. different reading id allowed again (gate resets)
 */
import { describe, it, expect } from "vitest";
import { INITIAL_GATE, resolveHydration, markDirty } from "./form-hydration";

const A = "aaaa1111-0000-0000-0000-000000000001";
const B = "bbbb2222-0000-0000-0000-000000000002";

describe("resolveHydration (WO-STAB-004 gate)", () => {
  it("first hydration is allowed", () => {
    const r = resolveHydration(INITIAL_GATE, A);
    expect(r.hydrate).toBe(true);
    expect(r.next).toEqual({ hydratedId: A, dirty: false });
  });

  it("same record, pristine form: server refresh still hydrates", () => {
    const afterFirst = resolveHydration(INITIAL_GATE, A).next;
    const r = resolveHydration(afterFirst, A);
    expect(r.hydrate).toBe(true);
  });

  it("same record, user edited: background snapshot is DENIED (bug regression)", () => {
    const afterFirst = resolveHydration(INITIAL_GATE, A).next;
    const afterEdit = markDirty(afterFirst);
    const r = resolveHydration(afterEdit, A);
    expect(r.hydrate).toBe(false);
    expect(r.next.dirty).toBe(true); // gate stays latched
  });

  it("different reading id hydrates again even while dirty (gate resets)", () => {
    const dirtyOnA = markDirty(resolveHydration(INITIAL_GATE, A).next);
    const r = resolveHydration(dirtyOnA, B);
    expect(r.hydrate).toBe(true);
    expect(r.next).toEqual({ hydratedId: B, dirty: false });
  });

  it("undefined id (create mode) is treated as a record switch, not a denial", () => {
    const dirtyOnA = markDirty(resolveHydration(INITIAL_GATE, A).next);
    const r = resolveHydration(dirtyOnA, undefined);
    expect(r.hydrate).toBe(true);
    expect(r.next.hydratedId).toBeNull();
  });

  it("dirty state persists across denied snapshots until reset by id change", () => {
    let gate = markDirty(resolveHydration(INITIAL_GATE, A).next);
    for (let i = 0; i < 3; i++) {
      const r = resolveHydration(gate, A);
      expect(r.hydrate).toBe(false);
      gate = r.next;
    }
    expect(resolveHydration(gate, B).hydrate).toBe(true);
  });
});
