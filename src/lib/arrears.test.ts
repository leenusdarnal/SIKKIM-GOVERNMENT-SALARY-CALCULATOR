import { describe, expect, it } from 'vitest';
import { DEFAULT_SALARY_INPUT, type SalaryInput } from './salary';
import {
  calculateArrears,
  createArrearsAuditCsv,
  createArrearsCsv,
  getArrearsMonthKeys,
  type ArrearsInput
} from './arrears';
import type { HistoricalRateEntry } from './historical-rates';

const baseSalary: SalaryInput = {
  ...DEFAULT_SALARY_INPUT,
  basicPay: 56_000,
  daRate: 58,
  pensionMode: 'cps',
  cpsMembershipConfirmed: true,
  professionalTaxMode: 'auto',
  professionalTaxLevelBand: 'level-15-and-above'
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

describe('Professional Tax pay-level safeguards in arrears', () => {
  it('blocks automatic Professional Tax when the pay-level band is missing', () => {
    const result = calculateArrears(makeInput({ baseSalary: { ...baseSalary, professionalTaxLevelBand: 'unselected' } }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('pay-level band');
  });
  it('applies the lower-level band across arrears months when selected', () => {
    const result = calculateArrears(makeInput({ baseSalary: { ...baseSalary, basicPay: 15_200, professionalTaxLevelBand: 'below-level-15' } }));
    expect(result.valid).toBe(true);
    expect(result.rows.every(row => row.professionalTax === 150)).toBe(true);
  });
});

describe('CPS membership safeguards in arrears', () => {
  it('blocks a CPS opening basis without explicit membership confirmation', () => {
    const result = calculateArrears(makeInput({ baseSalary: { ...baseSalary, cpsMembershipConfirmed: false } }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Confirm CPS membership');
  });

  it('requires an effective-dated CPS change to carry explicit confirmation', () => {
    const result = calculateArrears(makeInput({
      baseSalary: { ...baseSalary, pensionMode: 'none', cpsMembershipConfirmed: false },
      changes: [{
        effectiveMonth: '2026-02', type: 'allowance-deduction', description: 'CPS option confirmed',
        salaryUpdates: { pensionMode: 'cps' }
      }]
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('effective-dated change');
  });
});

describe('GPF membership and contribution consistency in arrears', () => {
  const confirmedGpf: SalaryInput = {
    ...baseSalary,
    pensionMode: 'gpf',
    cpsMembershipConfirmed: false,
    gpfMembershipConfirmed: true,
    gpfReferencePay: 30_000,
    manualPension: 2_000
  };

  it('calculates the confirmed GPF subscription as an employee deduction only', () => {
    const result = calculateArrears(makeInput({ baseSalary: confirmedGpf }));
    expect(result.valid).toBe(true);
    expect(result.rows.every(row => row.employeePension === 2_000)).toBe(true);
    expect(result.rows.every(row => row.employerCpsContribution === 0)).toBe(true);
    expect(result.rows.every(row => row.employeeDeductions === 2_000 + row.professionalTax + row.gis + row.stampFee + row.otherDeductions)).toBe(true);
  });

  it('blocks GPF without membership confirmation or reference pay / valid range', () => {
    expect(calculateArrears(makeInput({ baseSalary: { ...confirmedGpf, gpfMembershipConfirmed: false } })).valid).toBe(false);
    expect(calculateArrears(makeInput({ baseSalary: { ...confirmedGpf, gpfReferencePay: 0 } })).valid).toBe(false);
    expect(calculateArrears(makeInput({ baseSalary: { ...confirmedGpf, manualPension: 1_799 } })).valid).toBe(false);
    expect(calculateArrears(makeInput({ baseSalary: { ...confirmedGpf, manualPension: 30_001 } })).valid).toBe(false);
  });

  it('requires full GPF basis when a dated change switches from CPS to GPF', () => {
    const result = calculateArrears(makeInput({ changes: [{
      effectiveMonth: '2026-02', type: 'allowance-deduction', description: 'GPF subscription starts',
      salaryUpdates: { pensionMode: 'gpf', manualPension: 2_000 }
    }] }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('GPF account');
  });

  it('validates GPF changes that alter only the monthly subscription', () => {
    const result = calculateArrears(makeInput({
      baseSalary: confirmedGpf,
      changes: [{ effectiveMonth: '2026-02', type: 'allowance-deduction', description: 'Subscription changed', salaryUpdates: { manualPension: 1_000 } }]
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('6%–100%');
  });
});

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
    expect(result.rows.every(row => row.employerCpsContribution === row.employeePension)).toBe(true);
    expect(result.rows.every(row => row.employeeDeductions === row.employeePension + row.professionalTax + row.gis + row.stampFee + row.otherDeductions)).toBe(true);
    expect(result.totals.employerCpsContribution).toBe(result.rows.reduce((sum,row)=>sum+row.employeePension,0));
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
    expect(result.rows[1].employerCpsContribution).toBe(0);
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
    expect(csv).toContain('Employer / State CPS contribution (separate, INR)');
  });
  it('uses verified historical DA rates month by month in arrears calculations', () => {
    const historicalRateSchedule: HistoricalRateEntry[] = [
      { component: 'daRate', effectiveFrom: '2026-01', effectiveTo: '2026-02', value: 58, unit: 'percent', sourceReference: 'Verified DA Order A', verified: true },
      { component: 'daRate', effectiveFrom: '2026-03', value: 60, unit: 'percent', sourceReference: 'Verified DA Order B', verified: true }
    ];
    const result = calculateArrears(makeInput({
      historicalRateSchedule,
      historicalRateComponents: ['daRate']
    }));
    expect(result.valid).toBe(true);
    expect(result.rows.map((row) => row.daRate)).toEqual([58, 58, 60]);
    expect(result.rows[2].appliedChanges).toContain('Historical daRate: 60% (Verified DA Order B)');
  });

  it('blocks arrears calculation when a selected historical rate is missing', () => {
    const result = calculateArrears(makeInput({
      historicalRateSchedule: [
        { component: 'daRate', effectiveFrom: '2026-01', effectiveTo: '2026-02', value: 58, unit: 'percent', sourceReference: 'Verified DA Order A', verified: true }
      ],
      historicalRateComponents: ['daRate']
    }));
    expect(result.valid).toBe(false);
    expect(result.rows).toHaveLength(0);
    expect(result.errors.some((message) => message.includes('2026-03: missing verified historical rate(s): daRate'))).toBe(true);
  });

  it('requires the schedule and selected component list together', () => {
    const result = calculateArrears(makeInput({
      historicalRateComponents: ['daRate']
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Provide both a historical rate schedule and its selected components.');
  });

  it('rejects duplicate historical component selections and overlapping source periods', () => {
    const result = calculateArrears(makeInput({
      historicalRateSchedule: [
        { component: 'daRate', effectiveFrom: '2026-01', value: 58, unit: 'percent', sourceReference: 'Order A', verified: true },
        { component: 'daRate', effectiveFrom: '2026-02', value: 60, unit: 'percent', sourceReference: 'Order B', verified: true }
      ],
      historicalRateComponents: ['daRate', 'daRate']
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Historical rate components must not contain duplicates.');
    expect(result.errors.some((message) => message.includes('Overlapping effective periods'))).toBe(true);
  });

  it('rejects a manual DA change when DA is controlled by the historical schedule', () => {
    const result = calculateArrears(makeInput({
      historicalRateSchedule: [
        { component: 'daRate', effectiveFrom: '2026-01', value: 58, unit: 'percent', sourceReference: 'Verified DA Order', verified: true }
      ],
      historicalRateComponents: ['daRate'],
      changes: [{ effectiveMonth: '2026-02', type: 'da-revision', daRate: 60, description: 'Conflicting manual DA revision' }]
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('DA is controlled by the historical rate schedule'))).toBe(true);
  });

});
