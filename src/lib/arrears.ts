import { calculateSalary, type SalaryInput } from './salary';

export type ArrearChangeType =
  | 'da-revision'
  | 'annual-increment'
  | 'promotion'
  | 'pay-fixation'
  | 'manual-adjustment';

export interface ArrearChange {
  effectiveMonth: string;
  type: ArrearChangeType;
  description: string;
  /** New basic pay from this month onward; enter the pay fixed by the competent order. */
  basicPay?: number;
  /** New DA percentage from this month onward; enter the rate in the applicable order. */
  daRate?: number;
}

export interface MonthlyPaidRecord {
  month: string;
  /** Net salary actually credited, as shown in the payslip/bank record. */
  actualTakeHome: number | null;
  /** Additional recovery to be deducted from this arrears settlement; do not duplicate payroll deductions. */
  recovery: number;
}

export interface ArrearsInput {
  startMonth: string;
  endMonth: string;
  baseSalary: SalaryInput;
  changes: ArrearChange[];
  monthlyRecords: MonthlyPaidRecord[];
}

export interface ArrearMonthRow {
  month: string;
  basicPay: number;
  daRate: number;
  grossEntitlement: number;
  employeeDeductions: number;
  revisedTakeHome: number;
  actualTakeHome: number | null;
  recovery: number;
  netArrears: number | null;
  appliedChanges: string[];
}

export interface ArrearsTotals {
  grossEntitlement: number;
  employeeDeductions: number;
  revisedTakeHome: number;
  actualTakeHome: number;
  recoveries: number;
  positiveArrears: number;
  negativeBalance: number;
  netArrears: number | null;
}

export interface ArrearsResult {
  valid: boolean;
  complete: boolean;
  errors: string[];
  rows: ArrearMonthRow[];
  totals: ArrearsTotals;
}

const MAX_MONTHS = 60;
const CHANGE_TYPES = new Set<ArrearChangeType>([
  'da-revision',
  'annual-increment',
  'promotion',
  'pay-fixation',
  'manual-adjustment'
]);

const NUMERIC_SALARY_FIELDS = [
  'basicPay', 'daRate', 'hraRate', 'hraMinimum', 'sbcaRate',
  'transportAllowance', 'otherEarnings', 'manualPension',
  'manualProfessionalTax', 'gis', 'stampFee', 'otherDeductions'
] as const;

function monthIndex(value: string): number | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const [year, month] = value.split('-').map(Number);
  if (year < 1900 || year > 2200) return null;
  return year * 12 + month - 1;
}

function monthKey(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return String(year).padStart(4, '0') + '-' + String(month).padStart(2, '0');
}

export function getArrearsMonthKeys(startMonth: string, endMonth: string): string[] {
  const start = monthIndex(startMonth);
  const end = monthIndex(endMonth);
  if (start === null || end === null || end < start || end - start + 1 > MAX_MONTHS) return [];
  return Array.from({ length: end - start + 1 }, (_, offset) => monthKey(start + offset));
}

function validateSalaryBasis(input: SalaryInput): string[] {
  const errors: string[] = [];

  for (const field of NUMERIC_SALARY_FIELDS) {
    const value = input[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      errors.push(field + ' must be a valid non-negative number.');
    }
  }

  if (!(input.basicPay > 0)) errors.push('Enter a basic pay greater than zero.');
  if (input.daRate > 200) errors.push('DA rate must be between 0% and 200%.');
  if (input.hraRate > 100 || input.sbcaRate > 100) {
    errors.push('HRA and SBCA rates must be between 0% and 100%.');
  }
  if (!['cps', 'gpf', 'manual', 'none'].includes(input.pensionMode)) {
    errors.push('Select the applicable pension arrangement before calculating arrears.');
  }
  if (!['auto', 'manual', 'none'].includes(input.professionalTaxMode)) {
    errors.push('Select a Professional Tax treatment before calculating arrears.');
  }

  return errors;
}

function validateChange(change: ArrearChange, index: number, months: string[]): string[] {
  const errors: string[] = [];
  if (!months.includes(change.effectiveMonth)) {
    errors.push('Change ' + (index + 1) + ': effective month must be within the selected arrears period.');
  }
  if (!CHANGE_TYPES.has(change.type)) {
    errors.push('Change ' + (index + 1) + ': select a supported change type.');
  }
  if (!change.description.trim()) {
    errors.push('Change ' + (index + 1) + ': enter an order/reference description.');
  }
  if (change.basicPay !== undefined &&
      (!Number.isFinite(change.basicPay) || change.basicPay <= 0)) {
    errors.push('Change ' + (index + 1) + ': new basic pay must be greater than zero.');
  }
  if (change.daRate !== undefined &&
      (!Number.isFinite(change.daRate) || change.daRate < 0 || change.daRate > 200)) {
    errors.push('Change ' + (index + 1) + ': DA rate must be between 0% and 200%.');
  }
  if (change.type === 'da-revision' && change.daRate === undefined) {
    errors.push('Change ' + (index + 1) + ': enter the revised DA rate from the order.');
  }
  if (['annual-increment', 'promotion', 'pay-fixation'].includes(change.type) &&
      change.basicPay === undefined) {
    errors.push('Change ' + (index + 1) + ': enter the new basic pay fixed under the order.');
  }
  if (change.type === 'manual-adjustment' &&
      change.basicPay === undefined && change.daRate === undefined) {
    errors.push('Change ' + (index + 1) + ': enter a new basic pay and/or DA rate.');
  }
  return errors;
}

function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[\\u0000-\\u0020]*[=+\\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function calculateArrears(input: ArrearsInput): ArrearsResult {
  const errors: string[] = [];
  const months = getArrearsMonthKeys(input.startMonth, input.endMonth);

  if (!months.length) {
    errors.push('Enter a valid period of no more than 60 consecutive months, with the end month on or after the start month.');
  }
  errors.push(...validateSalaryBasis(input.baseSalary));
  input.changes.forEach((change, index) => {
    errors.push(...validateChange(change, index, months));
  });

  const paidByMonth = new Map<string, MonthlyPaidRecord>();
  for (const [index, record] of input.monthlyRecords.entries()) {
    if (!months.includes(record.month)) {
      errors.push('Paid record ' + (index + 1) + ': month is outside the selected period.');
      continue;
    }
    if (paidByMonth.has(record.month)) {
      errors.push('Paid record ' + (index + 1) + ': duplicate month ' + record.month + '.');
      continue;
    }
    if (record.actualTakeHome !== null &&
        (!Number.isFinite(record.actualTakeHome) || record.actualTakeHome < 0)) {
      errors.push('Paid record ' + (index + 1) + ': actual credited salary must be non-negative.');
    }
    if (!Number.isFinite(record.recovery) || record.recovery < 0) {
      errors.push('Paid record ' + (index + 1) + ': recovery must be non-negative.');
    }
    paidByMonth.set(record.month, record);
  }

  if (errors.length || !months.length) {
    return {
      valid: false,
      complete: false,
      errors,
      rows: [],
      totals: {
        grossEntitlement: 0,
        employeeDeductions: 0,
        revisedTakeHome: 0,
        actualTakeHome: 0,
        recoveries: 0,
        positiveArrears: 0,
        negativeBalance: 0,
        netArrears: null
      }
    };
  }

  const orderedChanges = input.changes
    .map((change, originalIndex) => ({ change, originalIndex }))
    .sort((a, b) =>
      a.change.effectiveMonth.localeCompare(b.change.effectiveMonth) ||
      a.originalIndex - b.originalIndex
    );

  let basicPay = input.baseSalary.basicPay;
  let daRate = input.baseSalary.daRate;
  let nextChange = 0;
  const rows: ArrearMonthRow[] = [];

  for (const month of months) {
    const appliedChanges: string[] = [];
    while (
      nextChange < orderedChanges.length &&
      orderedChanges[nextChange].change.effectiveMonth <= month
    ) {
      const change = orderedChanges[nextChange].change;
      if (change.basicPay !== undefined) basicPay = change.basicPay;
      if (change.daRate !== undefined) daRate = change.daRate;
      appliedChanges.push(change.description);
      nextChange += 1;
    }

    const salary = calculateSalary({
      ...input.baseSalary,
      basicPay,
      daRate
    });
    const paid = paidByMonth.get(month);
    const actualTakeHome = paid?.actualTakeHome ?? null;
    const recovery = paid?.recovery ?? 0;

    rows.push({
      month,
      basicPay: salary.basicPay,
      daRate: salary.daRate,
      grossEntitlement: salary.gross,
      employeeDeductions: salary.totalDeductions,
      revisedTakeHome: salary.takeHome,
      actualTakeHome,
      recovery,
      netArrears: actualTakeHome === null
        ? null
        : salary.takeHome - actualTakeHome - recovery,
      appliedChanges
    });
  }

  const complete = rows.every((row) => row.actualTakeHome !== null);
  const totals: ArrearsTotals = rows.reduce((sum, row) => ({
    grossEntitlement: sum.grossEntitlement + row.grossEntitlement,
    employeeDeductions: sum.employeeDeductions + row.employeeDeductions,
    revisedTakeHome: sum.revisedTakeHome + row.revisedTakeHome,
    actualTakeHome: sum.actualTakeHome + (row.actualTakeHome ?? 0),
    recoveries: sum.recoveries + row.recovery,
    positiveArrears: sum.positiveArrears + (row.netArrears === null ? 0 : Math.max(0, row.netArrears)),
    negativeBalance: sum.negativeBalance + (row.netArrears === null ? 0 : Math.min(0, row.netArrears)),
    netArrears: sum.netArrears === null || row.netArrears === null
      ? null
      : sum.netArrears + row.netArrears
  }), {
    grossEntitlement: 0,
    employeeDeductions: 0,
    revisedTakeHome: 0,
    actualTakeHome: 0,
    recoveries: 0,
    positiveArrears: 0,
    negativeBalance: 0,
    netArrears: 0
  });

  return { valid: true, complete, errors: [], rows, totals };
}

export function createArrearsCsv(result: ArrearsResult): string {
  if (!result.valid || !result.complete || result.totals.netArrears === null) {
    throw new Error('Complete all actual credited salary entries before exporting the arrears statement.');
  }

  const rows = [
    ['Month', 'Basic Pay (INR)', 'DA Rate (%)', 'Revised Gross (INR)', 'Employee Deductions (INR)', 'Revised Take-home (INR)', 'Actual Credited (INR)', 'Recovery from Arrears (INR)', 'Net Difference (INR)', 'Effective change / order reference'],
    ...result.rows.map((row) => [
      row.month,
      row.basicPay,
      row.daRate,
      row.grossEntitlement,
      row.employeeDeductions,
      row.revisedTakeHome,
      row.actualTakeHome ?? '',
      row.recovery,
      row.netArrears ?? '',
      row.appliedChanges.join('; ')
    ])
  ];

  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
