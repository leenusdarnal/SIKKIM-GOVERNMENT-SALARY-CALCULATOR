import { describe, expect, it } from 'vitest';
import { calculateSalary, getSikkimProfessionalTax } from './salary';
import { PAY_MATRIX } from './data/pay-matrix';

describe('Sikkim pay matrix', () => {
  it('contains all 23 levels with 40 cells each', () => {
    expect(Object.keys(PAY_MATRIX)).toHaveLength(23);
    for (const row of Object.values(PAY_MATRIX)) expect(row).toHaveLength(40);
  });

  it('retains known starting values', () => {
    expect(PAY_MATRIX[1][0]).toBe(15_200);
    expect(PAY_MATRIX[15][0]).toBe(46_300);
    expect(PAY_MATRIX[17][0]).toBe(56_000);
    expect(PAY_MATRIX[23][0]).toBe(124_700);
  });
});

describe('Sikkim Professional Tax slabs', () => {
  it.each([
    [20_000, 0], [20_001, 125], [30_000, 125],
    [30_001, 150], [40_000, 150], [40_001, 200]
  ])('calculates ₹%i as ₹%i tax', (salary, expected) => {
    expect(getSikkimProfessionalTax(salary).amount).toBe(expected);
  });
});

describe('salary calculation', () => {
  const base = {
    basicPay: 56_000, daRate: 60, hraEligible: true,
    hraRate: 12, hraMinimum: 0, sbcaRate: 8,
    transportAllowance: 0, otherEarnings: 0,
    pensionMode: 'cps' as const, manualPension: 0,
    professionalTaxMode: 'auto' as const, manualProfessionalTax: 0,
    gis: 0, stampFee: 0, otherDeductions: 0
  };

  it('calculates Level 17 Cell 1', () => {
    const result = calculateSalary(base);
    expect(result.da).toBe(33_600);
    expect(result.hra).toBe(6_720);
    expect(result.sbca).toBe(4_480);
    expect(result.gross).toBe(100_800);
    expect(result.employeePension).toBe(8_960);
    expect(result.employerCpsContribution).toBe(8_960);
    expect(result.professionalTax).toBe(200);
    expect(result.totalDeductions).toBe(9_160);
    expect(result.takeHome).toBe(91_640);
  });

  it('calculates Level 1 Cell 1', () => {
    const result = calculateSalary({
      ...base, basicPay: 15_200
    });
    expect(result.gross).toBe(27_360);
    expect(result.employeePension).toBe(2_432);
    expect(result.professionalTax).toBe(125);
    expect(result.takeHome).toBe(24_803);
  });

  it('omits HRA when the employee is not eligible', () => {
    const result = calculateSalary({ ...base, hraEligible: false, pensionMode: 'none', professionalTaxMode: 'none' });
    expect(result.hra).toBe(0);
    expect(result.employerCpsContribution).toBe(0);
  });

  it('keeps the State matching contribution out of employee deductions', () => {
    const result = calculateSalary(base);
    expect(result.employeePension).toBe(8_960);
    expect(result.employerCpsContribution).toBe(8_960);
    expect(result.totalDeductions).toBe(9_160);
    expect(result.takeHome).toBe(91_640);
  });

  it('uses manual GPF without creating an employer CPS match', () => {
    const result = calculateSalary({ ...base, pensionMode: 'gpf', manualPension: 2_000 });
    expect(result.employeePension).toBe(2_000);
    expect(result.employerCpsContribution).toBe(0);
  });
});
