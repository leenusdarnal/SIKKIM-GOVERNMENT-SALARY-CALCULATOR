import { describe, expect, it } from 'vitest';
import { calculateSalary, DEFAULT_SALARY_INPUT, getSikkimProfessionalTax } from './salary';
import { PAY_LEVELS, PAY_MATRIX, PAY_MATRIX_CELL_COUNTS, PAY_MATRIX_TOTAL_CELLS } from './data/pay-matrix';

describe('Sikkim pay matrix', () => {
  it('contains all 23 Government levels and exactly 794 printed cells', () => {
    expect(PAY_LEVELS).toEqual(Array.from({ length: 23 }, (_, index) => index + 1));
    expect(Object.keys(PAY_MATRIX)).toHaveLength(23);
    expect(PAY_MATRIX_TOTAL_CELLS).toBe(794);
    expect(Object.values(PAY_MATRIX).reduce((total, row) => total + row.length, 0)).toBe(794);
  });

  it('uses the exact number of cells printed for each level in Schedule Part A', () => {
    expect(PAY_LEVELS.map((level) => PAY_MATRIX_CELL_COUNTS[level])).toEqual([
      40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 36, 35, 32, 28, 26, 23, 19, 18, 17
    ]);
    for (const level of PAY_LEVELS) {
      const row = PAY_MATRIX[level];
      expect(row.every((value, index) => index === 0 || value > row[index - 1])).toBe(true);
    }
  });

  it('does not expose a pay cell beyond the official final cell', () => {
    expect(PAY_MATRIX[15][35]).toBe(130_500);
    expect(PAY_MATRIX[15][36]).toBeUndefined();
    expect(PAY_MATRIX[16][34]).toBe(135_500);
    expect(PAY_MATRIX[16][35]).toBeUndefined();
    expect(PAY_MATRIX[17][31]).toBe(139_800);
    expect(PAY_MATRIX[17][32]).toBeUndefined();
    expect(PAY_MATRIX[23][16]).toBe(200_100);
    expect(PAY_MATRIX[23][17]).toBeUndefined();
  });

  it('retains known starting values', () => {
    expect(PAY_MATRIX[1][0]).toBe(15_200);
    expect(PAY_MATRIX[1][29]).toBe(36_100);
    expect(PAY_MATRIX[9][27]).toBe(56_700);
    expect(PAY_MATRIX[10][6]).toBe(36_100);
    expect(PAY_MATRIX[15][0]).toBe(46_300);
    expect(PAY_MATRIX[17][0]).toBe(56_000);
    expect(PAY_MATRIX[23][0]).toBe(124_700);
  });

  it('matches the published first-cell values across all 23 Government pay levels', () => {
    const officialStartingValues = [
      15_200, 16_200, 19_300, 18_000, 19_400, 20_300, 21_700, 22_800,
      25_400, 30_200, 33_700, 37_100, 37_600, 39_100, 46_300, 49_700,
      56_000, 65_000, 71_100, 83_700, 105_400, 120_500, 124_700
    ];
    expect(Object.keys(PAY_MATRIX)).toHaveLength(officialStartingValues.length);
    expect(Object.keys(PAY_MATRIX).map((level) => PAY_MATRIX[Number(level)][0]))
      .toEqual(officialStartingValues);
  });
});

describe('Sikkim Professional Tax pay-level bands', () => {
  it('applies ₹150 below Level 15 regardless of gross salary', () => {
    expect(getSikkimProfessionalTax('below-level-15').amount).toBe(150);
  });
  it('applies ₹200 at Level 15 and above regardless of gross salary', () => {
    expect(getSikkimProfessionalTax('level-15-and-above').amount).toBe(200);
  });
  it('does not infer a band when the pay level is not selected', () => {
    expect(getSikkimProfessionalTax('unselected').amount).toBe(0);
  });
});

describe('salary calculation', () => {
  it('does not assume a pension scheme or allowance eligibility by default', () => {
    expect(DEFAULT_SALARY_INPUT.pensionMode).toBe('unselected');
    expect(DEFAULT_SALARY_INPUT.hraEligible).toBe(false);
    expect(DEFAULT_SALARY_INPUT.sbcaRate).toBe(0);
    expect(DEFAULT_SALARY_INPUT.professionalTaxMode).toBe('unselected');
    expect(DEFAULT_SALARY_INPUT.professionalTaxLevelBand).toBe('unselected');
  });

  const base = {
    basicPay: 56_000, daRate: 60, hraEligible: true,
    hraRate: 12, hraMinimum: 0, sbcaRate: 8,
    transportAllowance: 0, otherEarnings: 0,
    pensionMode: 'cps' as const, manualPension: 0,
    professionalTaxMode: 'auto' as const, professionalTaxLevelBand: 'level-15-and-above' as const, manualProfessionalTax: 0,
    gis: 0, stampFee: 0, otherDeductions: 0
  };

  it('does not calculate Professional Tax until the treatment is selected', () => {
    const result = calculateSalary({ ...base, professionalTaxMode: 'unselected' });
    expect(result.professionalTax).toBe(0);
    expect(result.professionalTaxBand).toContain('Not selected');\n  });\n\n  it('does not apply automatic Professional Tax without a pay-level band', () => {\n    const result = calculateSalary({ ...base, professionalTaxLevelBand: 'unselected' });\n    expect(result.professionalTax).toBe(0);\n    expect(result.professionalTaxBand).toContain('not selected');
  });

  it('does not deduct CPS when the scheme has not been selected', () => {
    const result = calculateSalary({ ...base, pensionMode: 'unselected' });
    expect(result.employeePension).toBe(0);
    expect(result.employerCpsContribution).toBe(0);
    expect(result.pensionLabel).toContain('not selected');
  });

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
    expect(result.professionalTax).toBe(150);
    expect(result.takeHome).toBe(24_778);
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

  it('caps percentage-based allowance inputs at 100%', () => {
    const result = calculateSalary({ ...base, hraRate: 150, sbcaRate: 125 });
    expect(result.hra).toBe(56_000);
    expect(result.sbca).toBe(56_000);
  });

  it('uses manual Professional Tax without applying an automatic slab', () => {
    const result = calculateSalary({ ...base, professionalTaxMode: 'manual', manualProfessionalTax: 135 });
    expect(result.professionalTax).toBe(135);
    expect(result.professionalTaxBand).toBe('Manual override');
  });

  it('uses manual GPF without creating an employer CPS match', () => {
    const result = calculateSalary({ ...base, pensionMode: 'gpf', manualPension: 2_000 });
    expect(result.employeePension).toBe(2_000);
    expect(result.employerCpsContribution).toBe(0);
  });
});
