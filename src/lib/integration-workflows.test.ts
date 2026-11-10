import { describe, expect, it } from 'vitest';
import { DEFAULT_SALARY_INPUT, calculateSalary, type SalaryInput } from './salary';
import { buildPayslipModel, createPayslipCsv } from './payslip';
import { calculateArrears, getArrearsMonthKeys, type ArrearsInput } from './arrears';
import { buildArrearsStatement } from './arrears-statement';
import {
  loadArrearsScenario,
  parseArrearsEntryCsv,
  parseArrearsScenarioBackup,
  saveArrearsScenario,
  serializeArrearsScenario,
  type StorageLike
} from './arrears-storage';
import type { HistoricalRateEntry } from './historical-rates';
import { findNextMatrixCellAtOrAbove, getPayAtCell } from './pay-progression';
import { calculateRetirementEstimate, DEFAULT_RETIREMENT_INPUT } from './retirement';

const salaryInput = (overrides: Partial<SalaryInput> = {}): SalaryInput => ({
  ...DEFAULT_SALARY_INPUT,
  basicPay: 56_000,
  daRate: 58,
  hraEligible: true,
  hraRate: 12,
  pensionMode: 'none',
  professionalTaxMode: 'auto',
  professionalTaxLevelBand: 'level-15-and-above',
  gis: 10,
  ...overrides
});

const employee = {
  name: 'QA Employee',
  employeeId: 'QA-001',
  designation: 'Assistant',
  department: 'Test Department',
  office: 'Test Office',
  district: 'Gangtok',
  payLevel: 'Level 17',
  cell: '1'
};

const metadata = {
  employeeName: employee.name,
  employeeId: employee.employeeId,
  designation: employee.designation,
  department: employee.department,
  office: employee.office,
  district: employee.district,
  payLevel: employee.payLevel,
  cell: employee.cell
};

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

function baseArrearsInput(overrides: Partial<ArrearsInput> = {}): ArrearsInput {
  return {
    startMonth: '2026-01',
    endMonth: '2026-03',
    baseSalary: salaryInput(),
    changes: [],
    monthlyRecords: [
      { month: '2026-01', actualTakeHome: 50_000, recovery: 0 },
      { month: '2026-02', actualTakeHome: 50_000, recovery: 0 },
      { month: '2026-03', actualTakeHome: 50_000, recovery: 0 }
    ],
    ...overrides
  };
}

describe('cross-module salary workflow integration', () => {
  it('keeps the payslip, annual summary and CSV aligned with the shared salary engine', () => {
    const input = salaryInput();
    const expected = calculateSalary(input);
    const model = buildPayslipModel('2026-04', employee, input, [
      { month: '2026-03', gross: 60_000, deductions: 5_000, net: 55_000 },
      { month: '2026-05', gross: 61_000, deductions: 5_100, net: 55_900 }
    ]);

    expect(model.valid).toBe(true);
    expect(model.salary).toEqual(expected);
    expect(model.annual.monthsRecorded).toBe(2);
    expect(model.annual.gross).toBe(60_000 + expected.gross);
    expect(model.annual.deductions).toBe(5_000 + expected.totalDeductions);
    expect(model.annual.net).toBe(55_000 + expected.takeHome);

    const csv = createPayslipCsv(model);
    expect(csv).toContain('"Gross salary","' + expected.gross + '"');
    expect(csv).toContain('"Net take-home","' + expected.takeHome + '"');
    expect(csv).not.toContain('61000');
  });

  it('applies the Sikkim Professional Tax pay-level bands consistently', () => {
    const below = calculateSalary(salaryInput({ professionalTaxLevelBand: 'below-level-15' }));
    const level15 = calculateSalary(salaryInput({ professionalTaxLevelBand: 'level-15-and-above' }));

    expect(below.professionalTax).toBe(150);
    expect(level15.professionalTax).toBe(200);
    expect(level15.takeHome).toBe(below.takeHome - 50);
  });

  it('carries effective-dated DA and basic-pay changes into arrears and the final statement', () => {
    const input = baseArrearsInput({
      changes: [
        {
          effectiveMonth: '2026-02',
          type: 'da-revision',
          daRate: 60,
          description: 'Illustrative DA revision order'
        },
        {
          effectiveMonth: '2026-03',
          type: 'annual-increment',
          basicPay: 57_000,
          description: 'Illustrative annual increment order'
        }
      ]
    });
    const result = calculateArrears(input);

    expect(result.valid).toBe(true);
    expect(result.complete).toBe(true);
    expect(result.rows.map((row) => row.daRate)).toEqual([58, 60, 60]);
    expect(result.rows.map((row) => row.basicPay)).toEqual([56_000, 56_000, 57_000]);
    expect(result.rows.every((row) =>
      row.netArrears === row.revisedTakeHome - (row.actualTakeHome ?? 0) - row.recovery
    )).toBe(true);

    const statement = buildArrearsStatement(result, metadata);
    expect(statement).not.toBeNull();
    expect(statement?.rows).toHaveLength(3);
    expect(statement?.totals.netArrears).toBe(result.totals.netArrears);
  });

  it('blocks a final arrears statement until every actual-paid month is entered', () => {
    const input = baseArrearsInput({
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: 50_000, recovery: 0 },
        { month: '2026-02', actualTakeHome: null, recovery: 0 },
        { month: '2026-03', actualTakeHome: 50_000, recovery: 0 }
      ]
    });
    const result = calculateArrears(input);

    expect(result.valid).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.rows[1].netArrears).toBeNull();
    expect(buildArrearsStatement(result, metadata)).toBeNull();
  });

  it('imports paid-month CSV, persists historical rates, and reproduces the same arrears totals after restore', () => {
    const schedule: HistoricalRateEntry[] = [
      {
        component: 'daRate',
        effectiveFrom: '2026-01',
        effectiveTo: '2026-02',
        value: 58,
        unit: 'percent',
        sourceReference: 'Illustrative verified DA order 2026/01',
        verified: true
      },
      {
        component: 'daRate',
        effectiveFrom: '2026-03',
        value: 60,
        unit: 'percent',
        sourceReference: 'Illustrative verified DA order 2026/03',
        verified: true
      }
    ];
    const months = getArrearsMonthKeys('2026-01', '2026-03');
    const paid = parseArrearsEntryCsv(
      '\uFEFFmonth,actualTakeHome,recovery\n2026-01,50000,0\n2026-02,49500,100\n2026-03,50000,250',
      months
    );
    const input = baseArrearsInput({
      monthlyRecords: paid,
      historicalRateSchedule: schedule,
      historicalRateComponents: ['daRate']
    });
    const before = calculateArrears(input);

    expect(before.valid).toBe(true);
    expect(before.complete).toBe(true);
    expect(before.rows.map((row) => row.daRate)).toEqual([58, 58, 60]);

    const storage = new MemoryStorage();
    saveArrearsScenario(input, storage);
    const restored = loadArrearsScenario(storage);
    expect(restored).not.toBeNull();

    const backup = serializeArrearsScenario(restored!);
    const parsed = parseArrearsScenarioBackup(backup);
    const after = calculateArrears(parsed);

    expect(after.valid).toBe(true);
    expect(after.complete).toBe(true);
    expect(after.rows).toEqual(before.rows);
    expect(after.totals).toEqual(before.totals);
    expect(buildArrearsStatement(after, metadata)?.totals.netArrears).toBe(before.totals.netArrears);
  });

  it('keeps the CPS State matching share separate from employee deductions and take-home', () => {
    const input = salaryInput({
      pensionMode: 'cps',
      cpsMembershipConfirmed: true
    });
    const salary = calculateSalary(input);
    const payslip = buildPayslipModel('2026-04', employee, input);

    expect(payslip.valid).toBe(true);
    expect(salary.employerCpsContribution).toBe(salary.employeePension);
    expect(salary.totalDeductions).toBe(
      salary.employeePension + salary.professionalTax + salary.gis +
      salary.stampFee + salary.otherDeductions
    );
    expect(salary.takeHome).toBe(salary.gross - salary.totalDeductions);
    expect(payslip.salary.employerCpsContribution).not.toBe(0);

    const arrears = calculateArrears(baseArrearsInput({
      baseSalary: input,
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: salary.takeHome, recovery: 0 },
        { month: '2026-02', actualTakeHome: salary.takeHome, recovery: 0 },
        { month: '2026-03', actualTakeHome: salary.takeHome, recovery: 0 }
      ]
    }));
    expect(arrears.valid).toBe(true);
    expect(arrears.rows[0].employerCpsContribution).toBe(arrears.rows[0].employeePension);
    expect(arrears.rows[0].employeeDeductions).not.toBe(
      arrears.rows[0].employeePension + arrears.rows[0].employerCpsContribution
    );
    expect(arrears.rows[0].netArrears).toBe(0);
  });

  it('carries GPF validation consistently from payslip into the arrears calculation', () => {
    const input = salaryInput({
      pensionMode: 'gpf',
      gpfMembershipConfirmed: true,
      gpfReferencePay: 56_000,
      manualPension: 3_360
    });
    const payslip = buildPayslipModel('2026-04', employee, input);
    const salary = calculateSalary(input);

    expect(payslip.valid).toBe(true);
    expect(salary.employeePension).toBe(3_360);
    expect(salary.employerCpsContribution).toBe(0);
    expect(salary.totalDeductions).toBe(
      salary.employeePension + salary.professionalTax + salary.gis +
      salary.stampFee + salary.otherDeductions
    );

    const arrears = calculateArrears(baseArrearsInput({
      baseSalary: input,
      monthlyRecords: [
        { month: '2026-01', actualTakeHome: salary.takeHome, recovery: 0 },
        { month: '2026-02', actualTakeHome: salary.takeHome, recovery: 0 },
        { month: '2026-03', actualTakeHome: salary.takeHome, recovery: 0 }
      ]
    }));
    expect(arrears.valid).toBe(true);
    expect(arrears.rows.every((row) => row.employeePension === 3_360)).toBe(true);
    expect(arrears.rows.every((row) => row.employerCpsContribution === 0)).toBe(true);
    expect(arrears.totals.netArrears).toBe(0);
  });

  it('passes a matrix-based pay-placement result into the effective-dated arrears workflow', () => {
    const currentMatrixPay = getPayAtCell(17, 1);
    expect(currentMatrixPay).not.toBeNull();

    const placement = findNextMatrixCellAtOrAbove(17, (currentMatrixPay ?? 0) + 1);
    expect(placement.valid).toBe(true);
    expect(placement.matrixBasicPay).toBeGreaterThan(currentMatrixPay ?? 0);

    const result = calculateArrears(baseArrearsInput({
      baseSalary: salaryInput({ basicPay: currentMatrixPay ?? 56_000 }),
      changes: [{
        effectiveMonth: '2026-02',
        type: 'pay-fixation',
        basicPay: placement.matrixBasicPay ?? 0,
        description: 'Test fixture: matrix cell placement confirmed for the scenario'
      }]
    }));

    expect(result.valid).toBe(true);
    expect(result.rows.map((row) => row.basicPay)).toEqual([
      currentMatrixPay,
      placement.matrixBasicPay,
      placement.matrixBasicPay
    ]);
  });

  it('feeds explicitly configured salary figures into the retirement estimator without assuming rule values', () => {
    const salary = calculateSalary(salaryInput());
    const estimate = calculateRetirementEstimate({
      ...DEFAULT_RETIREMENT_INPUT,
      pensionableEmoluments: salary.basicPay,
      pensionRatePercent: 50,
      commutationPercent: 30,
      commutationMultiplierMonths: 100,
      gratuityEmoluments: salary.basicPay,
      gratuityServiceUnits: 20,
      gratuityMultiplier: 1,
      gratuityDivisor: 2,
      gratuityCeiling: 500_000,
      leaveSalaryMonthly: salary.basicPay,
      eligibleLeaveDays: 30,
      leaveEncashmentDivisor: 30
    });

    expect(estimate.valid).toBe(true);
    expect(estimate.monthlyPension).toBe(28_000);
    expect(estimate.residualMonthlyPension).toBe(19_600);
    expect(estimate.gratuity).toBe(500_000);
    expect(estimate.leaveEncashment).toBe(56_000);
  });
});
