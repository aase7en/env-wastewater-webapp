import { describe, expect, it } from 'vitest';
import { ASSETS, EMPTY_SNAPSHOT, SITE, readableMetric, readableMode } from './wwtp-model';

describe('WWTP concept contract', () => {
 it('preserves unknown as unknown, not zero', () => {
  expect(readableMetric(undefined)).toBe('ไม่มีข้อมูล');
  expect(readableMetric({ value:null,source:'unavailable',observedAt:null,freshness:'unknown' })).toBe('ไม่มีข้อมูล');
  expect(readableMetric({ value:0,unit:'mg/L',source:'manual-snapshot',observedAt:null,freshness:'unknown' })).toBe('0 mg/L');
 });
 it('distinguishes latest manual from actual live telemetry', () => {
  expect(readableMode('latest')).toBe('บันทึกล่าสุด');
  expect(readableMode('live')).toBe('เซนเซอร์เรียลไทม์');
  expect(EMPTY_SNAPSHOT.mode).toBe('unavailable');
  expect(EMPTY_SNAPSHOT.date).toBeNull();
 });
 it('has a complete stable asset catalogue and site capacity metadata', () => {
  for(const id of ['T001','T003','T004','T005','T006','T008','CTRL','P001A','P001B','AER1','AER2','SP001','CL001'] as const) {
   expect(ASSETS[id].name).toBeTruthy();
  }
  expect(SITE.nominalCapacityM3).toBe(60);
 });
});
