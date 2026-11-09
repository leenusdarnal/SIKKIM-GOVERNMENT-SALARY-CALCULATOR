import { describe, expect, it } from 'vitest';
import { calculateGpfContribution } from './gpf';

describe('Sikkim GPF contribution estimate', () => {
  it('calculates a valid 6% minimum illustration', () => {
    expect(calculateGpfContribution(56_000, 6)).toMatchObject({
      monthlyContribution: 3_360,
      annualContribution: 40_320,
      minimumMonthlyContribution: 3_360,
      maximumMonthlyContribution: 56_000,
      valid: true
    });
  });
  it('calculates a selected contribution rate', () => {
    expect(calculateGpfContribution(46_300, 10).monthlyContribution).toBe(4_630);
  });
  it('allows up to 100% of reference pay', () => {
    expect(calculateGpfContribution(30_000, 100).monthlyContribution).toBe(30_000);
  });
  it('rejects rates below 6% and above 100%', () => {
    expect(calculateGpfContribution(56_000, 5.99).valid).toBe(false);
    expect(calculateGpfContribution(56_000, 100.01).valid).toBe(false);
  });
  it('rejects missing or invalid reference pay', () => {
    expect(calculateGpfContribution(0, 10).valid).toBe(false);
    expect(calculateGpfContribution(Number.NaN, 10).valid).toBe(false);
  });
});
