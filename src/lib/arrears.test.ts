import { describe, expect, it } from 'vitest';
import { DEFAULT_SALARY_INPUT, type SalaryInput } from './salary';
import {
  calculateArrears,
  createArrearsCsv,
  getArrearsMonthKeys,
  type ArrearsInput
} from './arrears';

const baseSalary: SalaryInput = {
  ...DEFAULT_SALARY_INPUT,
  basicPay: 56_000,
  daRate: 58,
  pensionMode: 'cps',
  professionalTaxMode: 'auto'
};

function makeInput(overrides: Partial<ArrearsInput> = {}): ArrearsInput {
  return {
    startMonth: '2026-01',
    endMonth: '2026-03',
    baseSalary,
    changes: [],
    monthlyRecords: [
      { month: '2026-01', actualTakeHome: 0, recovery: 0 },
      { month: '2026-02', actualTakeHome: 0, recovery: 0 },
      { month: '2026-03', actualTakeHome: 0, recovery: 0 }
    ],
    ...overrides
  };
}

describe('Sikkim salary arrears planner', () => {
  it('generates consecutive month keys and rejects invalid or overlong periods', () => {
    expect(getArrearsMonthKeys('2026-11', '2027-02')).toEqual([
      '2026-11', '2026-12', '2027-01', '2027-02'
    ]);
    expect(getArrearsMonthKeys('2026-13', '2027-01')).toEqual([]);
    expect(getArrearsMonthKeys('2026-04', '2026-03')).toEqual([]);
    expect(getArrearsMonthKeys('2020-01', '2025-01')).toEqual([]);
  });

  it('uses the starting salary basis until the effective month of a DA change', () => {
    const result = calculateArrears(makeInput({
      changes: [{ effectiveMonth: '2026-02', type: 'da-revision', daRate: 60, description: 'DA order 01/2026' }]
    }));
    expect(result.valid).toBe(true);
    expect(result.rows.map((row) => row.daRate)).toEqual([58, 60, 60]);
    expect(result.rows[0].revisedTakeHome).toBeLessThan(result.rows[1].revisedTakeHome);
  });

  it('applies increments and promotion pay from their effective month forward', () => {
    const result = calculateArrears(makeInput({
      changes: [
        { effectiveMonth: '2026-02', type: 'annual-increment', basicPay: 57_700, description: 'Annual increment order' },
        { effectiveMonth: '2026-03', type: 'promotion', basicPay: 65_000, description: 'Promotion fixation order' }
      ]
    }));
    expect(result.rows.map((row) => row.basicPay)).toEqual([56_000, 57_700, 65_000]);
  });

  it('applies recoveries after comparing revised take-home to actual credited salary', () => {
    const noRecovery = calculateArrears(makeInput());
    const withRecovery = calculateArrears(makeInput({
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: 50_000, recovery: 500 },
        { month: '2026-02', actualTakeHome: 50_000, recovery: 500 },
        { month: '2026-03', actualTakeHome: 50_000, recovery: 500 }
      ]
    }));
    expect(noRecovery.rows[0].netArrears).toBe(noRecovery.rows[0].revisedTakeHome);
    expect(withRecovery.rows[0].netArrears).toBe(withRecovery.rows[0].revisedTakeHome - 50_500);
    expect(withRecovery.totals.recoveries).toBe(1_500);
  });

  it('does not show a final total until actual credited salary is entered for every month', () => {
    const result = calculateArrears(makeInput({
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: 50_000, recovery: 0 },
        { month: '2026-02', actualTakeHome: null, recovery: 0 }
      ]
    }));
    expect(result.valid).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.totals.netArrears).toBeNull();
    expect(() => createArrearsCsv(result)).toThrow(/Complete all actual credited salary/);
  });

  it('rejects invalid changes, unselected pension/PT and negative monthly values', () => {
    const invalid = calculateArrears(makeInput({
      baseSalary: { ...baseSalary, pensionMode: 'unselected', professionalTaxMode: 'unselected' },
      changes: [{ effectiveMonth: '2026-04', type: 'da-revision', daRate: 250, description: '' }],
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: -1, recovery: -2 }
      ]
    }));
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThanOrEqual(5);
  });

  it('rejects a State CPS contribution rate above 100%', () => {
    const result = calculateArrears(makeInput({
      baseSalary: { ...baseSalary, cpsEmployerRate: 101 }
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('State contribution rate'))).toBe(true);
  });

  it('applies dated HRA eligibility, HRA rate, SBCA rate and transport allowance', () => {
    const result = calculateArrears(makeInput({
      changes: [{
        effectiveMonth: '2026-02',
        type: 'allowance-deduction',
        description: 'Posting allowance order effective February',
        salaryUpdates: {
          hraEligible: true,
          hraRate: 12,
          sbcaRate: 8,
          transportAllowance: 1_000
        }
      }]
    }));

    expect(result.valid).toBe(true);
    expect(result.rows[0].hra).toBe(0);
    expect(result.rows[0].sbca).toBe(0);
    expect(result.rows[1].hra).toBe(6_720);
    expect(result.rows[1].sbca).toBe(4_480);
    expect(result.rows[1].transportAllowance).toBe(1_000);
    expect(result.rows[2].hra).toBe(6_720);
  });

  it('applies dated GPF, Professional Tax, GIS and other deduction changes', () => {
    const result = calculateArrears(makeInput({
      changes: [{
        effectiveMonth: '2026-02',
        type: 'allowance-deduction',
        description: 'Revised deductions as per payslip',
        salaryUpdates: {
          pensionMode: 'gpf',
          manualPension: 2_500,
          professionalTaxMode: 'manual',
          manualProfessionalTax: 175,
          gis: 20,
          stampFee: 10,
          otherDeductions: 500
        }
      }]
    }));

    expect(result.valid).toBe(true);
    expect(result.rows[0].employeePension).toBe(baseSalary.basicPay * 0.1 + Math.round(baseSalary.basicPay * baseSalary.daRate / 100) * 0.1);
    expect(result.rows[1].employeePension).toBe(2_500);
    expect(result.rows[1].professionalTax).toBe(175);
    expect(result.rows[1].gis).toBe(20);
    expect(result.rows[1].stampFee).toBe(10);
    expect(result.rows[1].otherDeductions).toBe(500);
    expect(result.rows[1].employeeDeductions).toBe(3_205);
    expect(result.rows[1].revisedTakeHome).toBe(result.rows[1].grossEntitlement - 3_205);
  });

  it('carries forward earlier component changes until a later effective order supersedes them', () => {
    const result = calculateArrears(makeInput({
      changes: [
        {
          effectiveMonth: '2026-02',
          type: 'allowance-deduction',
          description: 'HRA eligibility order',
          salaryUpdates: { hraEligible: true, hraRate: 12 }
        },
        {
          effectiveMonth: '2026-03',
          type: 'allowance-deduction',
          description: 'HRA rate revision',
          salaryUpdates: { hraRate: 15 }
        }
      ]
    }));
    expect(result.rows.map((row) => row.hra)).toEqual([0, 6_720, 8_400]);
  });

  it('rejects invalid dated allowance and deduction values', () => {
    const result = calculateArrears(makeInput({
      changes: [{
        effectiveMonth: '2026-02',
        type: 'allowance-deduction',
        description: 'Invalid allowance revision',
        salaryUpdates: { hraRate: 125, gis: -10 }
      }]
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('hraRate must not exceed 100%'))).toBe(true);
    expect(result.errors.some((message) => message.includes('gis must be a non-negative number'))).toBe(true);
  });

  it('defers a notional increment until the employee joins and the increase becomes payable', () => {
    const result = calculateArrears(makeInput({
      startMonth: '2026-01',
      endMonth: '2026-04',
      changes: [{
        effectiveMonth: '2026-02',
        payableFromMonth: '2026-04',
        type: 'annual-increment',
        basicPay: 57_700,
        description: 'Study leave increment; payable after joining'
      }],
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: 0, recovery: 0 },
        { month: '2026-02', actualTakeHome: 0, recovery: 0 },
        { month: '2026-03', actualTakeHome: 0, recovery: 0 },
        { month: '2026-04', actualTakeHome: 0, recovery: 0 }
      ]
    }));
    expect(result.valid).toBe(true);
    expect(result.rows.map((row) => row.basicPay)).toEqual([56_000, 56_000, 56_000, 57_700]);
    expect(result.rows[3].appliedChanges[0]).toContain('notional 2026-02, payable 2026-04');
  });

  it('prorates the salary base using calendar payable days and a verified leave-salary factor', () => {
    const result = calculateArrears(makeInput({
      startMonth: '2026-01',
      endMonth: '2026-02',
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: 0, recovery: 0, payableDays: 15, salaryFactorPercent: 100 },
        { month: '2026-02', actualTakeHome: 0, recovery: 0, payableDays: 28, salaryFactorPercent: 50 }
      ]
    }));
    expect(result.valid).toBe(true);
    expect(result.rows[0].daysInMonth).toBe(31);
    expect(result.rows[0].basicPay).toBe(Math.round(56_000 * 15 / 31));
    expect(result.rows[1].basicPay).toBe(28_000);
    expect(result.rows[1].salaryFactor).toBe(0.5);
    expect(result.rows[1].employeePension).toBe(Math.round((28_000 + Math.round(28_000 * 0.58)) * 0.1));
  });

  it('rejects payable days beyond calendar days and leave factors outside 0–100%', () => {
    const result = calculateArrears(makeInput({
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: 0, recovery: 0, payableDays: 32, salaryFactorPercent: 100 },
        { month: '2026-02', actualTakeHome: 0, recovery: 0, payableDays: 28, salaryFactorPercent: 105 }
      ]
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('payable days must be between zero'))).toBe(true);
    expect(result.errors.some((message) => message.includes('salary factor must be between 0% and 100%'))).toBe(true);
  });

  it('calculates optional simple interest only on positive monthly arrears balances', () => {
    const principal = calculateArrears(makeInput({
      startMonth: '2026-01',
      endMonth: '2026-01',
      monthlyRecords: [{ month: '2026-01', actualTakeHome: 50_000, recovery: 0 }]
    })).rows[0].netArrears ?? 0;
    const result = calculateArrears(makeInput({
      startMonth: '2026-01',
      endMonth: '2026-01',
      monthlyRecords: [{ month: '2026-01', actualTakeHome: 50_000, recovery: 0 }],
      interestSettings: { annualRate: 12, settlementDate: '2026-02-28' }
    }));
    expect(result.valid).toBe(true);
    expect(result.rows[0].interestDays).toBe(28);
    expect(result.rows[0].interestAmount).toBe(Math.floor(principal * 12 * 28 / 36_500 + 0.5));
    expect(result.totals.totalIncludingInterest).toBe((result.totals.netArrears ?? 0) + result.totals.interestAmount);
  });

  it('does not calculate interest on negative balances and validates settlement date', () => {
    const negative = calculateArrears(makeInput({
      startMonth: '2026-01',
      endMonth: '2026-01',
      monthlyRecords: [{ month: '2026-01', actualTakeHome: 100_000, recovery: 0 }],
      interestSettings: { annualRate: 12, settlementDate: '2026-02-28' }
    }));
    expect(negative.rows[0].netArrears).toBeLessThan(0);
    expect(negative.rows[0].interestAmount).toBe(0);
    expect(negative.rows[0].interestDays).toBe(0);
    const invalid = calculateArrears(makeInput({
      interestSettings: { annualRate: 12, settlementDate: '2026-01-15' }
    }));
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.some((message) => message.includes('on or after the final arrears month-end'))).toBe(true);
  });

  it('reports State CPS matching separately without deducting it from employee take-home', () => {
    const baseline = calculateArrears(makeInput());
    const revised = calculateArrears(makeInput({
      changes: [{
        effectiveMonth: '2026-02',
        type: 'allowance-deduction',
        description: 'State CPS contribution revision',
        salaryUpdates: { cpsEmployerRate: 12 }
      }]
    }));
    expect(revised.valid).toBe(true);
    expect(revised.rows[0].employerCpsContribution).toBe(8_848);
    expect(revised.rows[1].employerCpsContribution).toBe(10_618);
    expect(revised.rows[0].revisedTakeHome).toBe(baseline.rows[0].revisedTakeHome);
    expect(revised.totals.employerCpsContribution).toBe(30_084);
    expect(revised.totals.netArrears).toBe(baseline.totals.netArrears);
  });

  it('includes a separate income-tax TDS deduction in the arrears line items', () => {
    const result = calculateArrears(makeInput({
      baseSalary: { ...baseSalary, incomeTaxTds: 2_000 },
      changes: [{
        effectiveMonth: '2026-02',
        type: 'allowance-deduction',
        description: 'TDS installment revision on payslip',
        salaryUpdates: { incomeTaxTds: 3_000 }
      }]
    }));
    expect(result.rows.map((row) => row.incomeTaxTds)).toEqual([2_000, 3_000, 3_000]);
  });

  it('reports monthly overpayment as a negative balance instead of hiding it', () => {
    const result = calculateArrears(makeInput({
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: 100_000, recovery: 0 },
        { month: '2026-02', actualTakeHome: 100_000, recovery: 0 },
        { month: '2026-03', actualTakeHome: 100_000, recovery: 0 }
      ]
    }));
    expect(result.totals.netArrears).toBeLessThan(0);
    expect(result.totals.negativeBalance).toBe(result.totals.netArrears);
  });

  it('exports CSV with quoted values and protects formula-like references', () => {
    const result = calculateArrears(makeInput({
      changes: [{ effectiveMonth: '2026-02', type: 'da-revision', daRate: 60, description: '=DA circular, revised' }]
    }));
    const csv = createArrearsCsv(result);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"\'=DA circular, revised"');
    expect(csv).toContain('Net Difference (INR)');
    expect(csv).toContain('HRA (INR)');
    expect(csv).toContain('Professional Tax (INR)');
    expect(csv).toContain('Total Employee Deductions (INR)');
    expect(csv).toContain('Income Tax TDS (INR)');
    expect(csv).toContain('Indicative Simple Interest (INR)');
    expect(csv).toContain('Payable Days');
  });
});
