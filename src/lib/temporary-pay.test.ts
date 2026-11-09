import { describe, expect, it } from 'vitest';
import { getTemporaryPay, TEMPORARY_PAY_OPTIONS } from './temporary-pay';

describe('Sikkim temporary and training pay references', () => {
  it('contains all five Group C/D equivalent-grade-pay rows from the 2026 notification', () => {
    expect(TEMPORARY_PAY_OPTIONS.filter((item) => item.id.startsWith('gp-')).map((item) => item.amount))
      .toEqual([18_000, 15_000, 12_000, 10_500, 9_000]);
  });

  it('contains all 16 specific-post consolidated-pay rows in the 2026 notification', () => {
    expect(TEMPORARY_PAY_OPTIONS.filter((item) => item.category === 'specific-post')).toHaveLength(16);
    expect(getTemporaryPay('consultant-super-specialist')).toBe(250_000);
    expect(getTemporaryPay('associate-professor-sgmc')).toBe(220_000);
    expect(getTemporaryPay('assistant-architect-engineer')).toBe(25_000);
  });

  it('applies 2024 direct-recruit training allowances by group and training location', () => {
    expect(getTemporaryPay('training-group-d-sikkim')).toBe(10_000);
    expect(getTemporaryPay('training-group-d-outside')).toBe(18_000);
    expect(getTemporaryPay('training-group-c-sikkim')).toBe(12_000);
    expect(getTemporaryPay('training-group-c-outside')).toBe(20_000);
    expect(getTemporaryPay('training-group-b-sikkim')).toBe(18_000);
    expect(getTemporaryPay('training-group-b-outside')).toBe(25_000);
  });

  it('does not invent a monthly amount for temporary drivers', () => {
    expect(getTemporaryPay('driver-daily-wage')).toBeNull();
    expect(getTemporaryPay('driver-daily-wage', 24, 500)).toBe(12_000);
    expect(getTemporaryPay('driver-daily-wage', -1, 500)).toBeNull();
  });

  it('returns null for an unknown option', () => {
    expect(getTemporaryPay('unknown-post')).toBeNull();
  });
});
