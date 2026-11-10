import { describe, expect, it } from 'vitest';
import { DEFAULT_SALARY_INPUT } from './salary';
import { applyHistoricalRates, resolveHistoricalRates, validateHistoricalRateSchedule, type HistoricalRateEntry } from './historical-rates';

const schedule: HistoricalRateEntry[] = [
  { component: 'daRate', effectiveFrom: '2026-01', effectiveTo: '2026-06', value: 60, unit: 'percent', sourceReference: 'Finance Dept DA Order 2026/01', verified: true },
  { component: 'daRate', effectiveFrom: '2026-07', value: 62, unit: 'percent', sourceReference: 'Finance Dept DA Order 2026/07', verified: true },
  { component: 'hraRate', effectiveFrom: '2026-01', value: 12, unit: 'percent', sourceReference: 'HRA Order 2026/01', verified: true, applicability: 'Only where employee is eligible' },
  { component: 'sbcaRate', effectiveFrom: '2026-01', value: 0, unit: 'percent', sourceReference: 'Employee-specific verified record', verified: true },
  { component: 'transportAllowance', effectiveFrom: '2026-01', value: 1000, unit: 'inr', sourceReference: 'Employee-specific sanction 2026/01', verified: true }
];

describe('source-backed historical salary rates', () => {
  it('resolves first, last and next effective month boundaries', () => {
    expect(resolveHistoricalRates('2026-01', schedule).values.daRate).toBe(60);
    expect(resolveHistoricalRates('2026-06', schedule).values.daRate).toBe(60);
    expect(resolveHistoricalRates('2026-07', schedule).values.daRate).toBe(62);
  });
  it('reports missing history instead of inventing a rate', () => {
    const result = resolveHistoricalRates('2025-12', schedule);
    expect(result.complete).toBe(false);
    expect(result.missing).toContain('daRate');
  });
  it('requires verification, source reference and correct units', () => {
    const errors = validateHistoricalRateSchedule([{ ...schedule[0], verified: false, sourceReference: '', unit: 'inr' }]);
    expect(errors.some((error) => error.includes('source and employee applicability'))).toBe(true);
    expect(errors.some((error) => error.includes('Government order'))).toBe(true);
    expect(errors.some((error) => error.includes('unit must be percent'))).toBe(true);
  });
  it('rejects overlapping periods for the same component', () => {
    const errors = validateHistoricalRateSchedule([schedule[0], { ...schedule[0], effectiveFrom: '2026-06', effectiveTo: '2026-12', value: 61 }]);
    expect(errors.some((error) => error.includes('Overlapping effective periods'))).toBe(true);
  });
  it('rejects invalid dates, reversed ranges and excessive rates', () => {
    const errors = validateHistoricalRateSchedule([
      { ...schedule[0], effectiveFrom: '2026-13' },
      { ...schedule[1], effectiveFrom: '2026-08', effectiveTo: '2026-07' },
      { ...schedule[2], value: 250 }
    ]);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
  it('applies a complete resolution without mutating the opening salary', () => {
    const base = { ...DEFAULT_SALARY_INPUT, basicPay: 56000 };
    const updated = applyHistoricalRates(base, resolveHistoricalRates('2026-07', schedule));
    expect(updated.daRate).toBe(62);
    expect(updated.hraRate).toBe(12);
    expect(updated.transportAllowance).toBe(1000);
    expect(base.daRate).toBe(DEFAULT_SALARY_INPUT.daRate);
  });
  it('refuses to apply an incomplete historical schedule', () => {
    expect(() => applyHistoricalRates(DEFAULT_SALARY_INPUT, resolveHistoricalRates('2025-12', schedule))).toThrow(/incomplete or invalid/);
  });
});
