import { describe, expect, it } from 'vitest';
import { calculateRetirementEstimate, DEFAULT_RETIREMENT_INPUT } from './retirement';

describe('calculateRetirementEstimate', () => {
  it('does not assume any pension or retirement benefit rules by default', () => {
    const r = calculateRetirementEstimate(DEFAULT_RETIREMENT_INPUT);
    expect(r.valid).toBe(true);
    expect(r.monthlyPension).toBe(0);
    expect(r.totalOneTimeBenefits).toBe(0);
  });

  it('calculates pension and commutation from explicitly supplied values', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, pensionableEmoluments: 50000, pensionRatePercent: 50, commutationPercent: 40, commutationMultiplierMonths: 120 });
    expect(r.monthlyPension).toBe(25000);
    expect(r.commutedMonthlyPension).toBe(10000);
    expect(r.residualMonthlyPension).toBe(15000);
    expect(r.commutationLumpSum).toBe(1200000);
  });

  it('handles zero and maximum commutation percentages without a negative residual', () => {
    const base = { ...DEFAULT_RETIREMENT_INPUT, pensionableEmoluments: 50000, pensionRatePercent: 50, commutationMultiplierMonths: 120 };
    const zero = calculateRetirementEstimate({ ...base, commutationPercent: 0, commutationMultiplierMonths: 0 });
    expect(zero.valid).toBe(true);
    expect(zero.residualMonthlyPension).toBe(25000);
    const full = calculateRetirementEstimate({ ...base, commutationPercent: 100 });
    expect(full.valid).toBe(true);
    expect(full.commutedMonthlyPension).toBe(25000);
    expect(full.residualMonthlyPension).toBe(0);
  });

  it('blocks incomplete pension and commutation sections and suppresses every amount', () => {
    const pensionOnlyBase = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, pensionableEmoluments: 50000 });
    expect(pensionOnlyBase.valid).toBe(false);
    expect(pensionOnlyBase.monthlyPension).toBe(0);
    const missingMultiplier = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, pensionableEmoluments: 50000, pensionRatePercent: 50, commutationPercent: 40 });
    expect(missingMultiplier.valid).toBe(false);
    expect(missingMultiplier.commutationLumpSum).toBe(0);
    const multiplierOnly = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, commutationMultiplierMonths: 120 });
    expect(multiplierOnly.valid).toBe(false);
  });

  it('applies a user-entered gratuity formula and ceiling', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, gratuityEmoluments: 60000, gratuityServiceUnits: 20, gratuityMultiplier: 1, gratuityDivisor: 2, gratuityCeiling: 500000 });
    expect(r.gratuityBeforeCeiling).toBe(600000);
    expect(r.gratuity).toBe(500000);
  });

  it('does not exceed a gratuity ceiling and leaves below-ceiling results unchanged', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, gratuityEmoluments: 30000, gratuityServiceUnits: 10, gratuityMultiplier: 1, gratuityDivisor: 2, gratuityCeiling: 500000 });
    expect(r.gratuityBeforeCeiling).toBe(150000);
    expect(r.gratuity).toBe(150000);
  });

  it('blocks partial gratuity inputs and does not expose a partial calculation', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, gratuityEmoluments: 60000, gratuityServiceUnits: 20, gratuityMultiplier: 1, gratuityDivisor: 2 });
    expect(r.valid).toBe(false);
    expect(r.gratuityBeforeCeiling).toBe(0);
    expect(r.gratuity).toBe(0);
  });

  it('calculates leave encashment only with a complete user-entered divisor set', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, leaveSalaryMonthly: 60000, eligibleLeaveDays: 30, leaveEncashmentDivisor: 30 });
    expect(r.leaveEncashment).toBe(60000);
  });

  it('blocks partial leave inputs and suppresses leave encashment', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, leaveSalaryMonthly: 60000, eligibleLeaveDays: 30 });
    expect(r.valid).toBe(false);
    expect(r.leaveEncashment).toBe(0);
    expect(r.totalOneTimeBenefits).toBe(0);
  });

  it('rounds formula outputs to the nearest whole rupee', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, pensionableEmoluments: 10001, pensionRatePercent: 50, leaveSalaryMonthly: 1000, eligibleLeaveDays: 1, leaveEncashmentDivisor: 3 });
    expect(r.monthlyPension).toBe(5001);
    expect(r.leaveEncashment).toBe(333);
  });

  it('blocks missing formula inputs and invalid percentages', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, pensionRatePercent: 110, commutationPercent: 30, gratuityEmoluments: 50000, gratuityServiceUnits: 10, gratuityMultiplier: 1, gratuityCeiling: 100000, leaveSalaryMonthly: 50000, eligibleLeaveDays: 20 });
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(4);
    expect(r.totalOneTimeBenefits).toBe(0);
  });

  it('rejects negative and non-finite input', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, eligibleLeaveDays: -1, pensionableEmoluments: Number.NaN });
    expect(r.valid).toBe(false);
    expect(r.monthlyPension).toBe(0);
  });

  it('rejects derived amounts outside the safe whole-rupee range', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, pensionableEmoluments: Number.MAX_VALUE, pensionRatePercent: 100 });
    expect(r.valid).toBe(false);
    expect(r.monthlyPension).toBe(0);
    expect(r.errors.some((error) => error.includes('supported whole-rupee calculation range'))).toBe(true);
  });

  it('keeps optional manually verified other benefits separate and totals them once', () => {
    const r = calculateRetirementEstimate({ ...DEFAULT_RETIREMENT_INPUT, otherRetirementBenefits: 12500 });
    expect(r.otherRetirementBenefits).toBe(12500);
    expect(r.totalOneTimeBenefits).toBe(12500);
  });
});
