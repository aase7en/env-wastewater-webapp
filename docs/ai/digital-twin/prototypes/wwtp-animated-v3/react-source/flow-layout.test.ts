import { describe, expect, it } from 'vitest';
import { LAYOUT, SITE, ASSETS, readableMetric } from './wwtp-model';

describe('WWTP V3 layout + metric safety', () => {
  it('keeps every basin inside the conceptual site footprint', () => {
    for (const tank of Object.values(LAYOUT)) {
      expect(Math.abs(tank.x) + tank.w / 2).toBeLessThan(SITE.width / 2);
      expect(Math.abs(tank.z) + tank.d / 2).toBeLessThan(SITE.depth / 2);
    }
  });
  it('matches the sketched major process order', () => {
    expect(LAYOUT.T001.x).toBeLessThan(ASSETS.CTRL.center[0]);
    expect(ASSETS.CTRL.center[0]).toBeLessThan(LAYOUT.T003.x);
    expect(LAYOUT.T003.z).toBeLessThan(LAYOUT.T004.z);
    expect(LAYOUT.T004.z).toBeLessThan(LAYOUT.T005.z);
    expect(LAYOUT.T006.x).toBeLessThan(LAYOUT.T005.x);
  });
  it('preserves null and zero as different readings', () => {
    expect(readableMetric(undefined)).toBe('ไม่มีข้อมูล');
    expect(readableMetric({value:0,source:'manual-snapshot',unit:'mg/L',observedAt:null,freshness:'unknown'})).toBe('0 mg/L');
  });
});
