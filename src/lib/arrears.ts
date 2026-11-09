import { calculateSalary, type SalaryInput } from './salary';

export type ArrearChangeType =
  | 'da-revision'
  | 'annual-increment'
  | 'promotion'
  | 'pay-fixation'
  | 'manual-adjustment'
  | 'allowance-deduction';

export type ArrearSalaryUpdate = Partial<Omit<SalaryInput, 'basicPay' | 'daRate'>>;

export interface ArrearChange {
  /** Notional / order effective month, e.g. increment accrual date. */
  effectiveMonth: string;
  /** Month from which the amount becomes payable; defaults to effectiveMonth. */
  payableFromMonth?: string;
  type: ArrearChangeType;
  description: string;
  /** New basic pay from this month onward; enter the pay fixed by the competent order. */
  basicPay?: number;
  /** New DA percentage from this month onward; enter the rate in the applicable order. */
  daRate?: number;
  /** Effective-dated changes to allowances and deductions, copied forward from this month. */
  salaryUpdates?: ArrearSalaryUpdate;
}

export interface MonthlyPaidRecord {
  month: string;
  /** Net salary actually credited, as shown in the payslip/bank record. */
  actualTakeHome: number | null;
  /** Additional recovery to be deducted from this arrears settlement; do not duplicate payroll deductions. */
  recovery: number;
  /** Days for which salary is payable; null/undefined means the whole calendar month. */
  payableDays?: number | null;
  /** Manual leave-salary / pay-eligibility factor applied to the pay base, from 0 to 100. */
  salaryFactorPercent?: number;
}

export interface ArrearsInterestSettings {
  /** User-entered annual simple-interest rate; zero means no interest is calculated. */
  annualRate: number;
  /** Date on which arrears are assumed to be settled. Required when annualRate is greater than zero. */
  settlementDate: string;
}

export interface ArrearsInput {
  startMonth: string;
  endMonth: string;
  baseSalary: SalaryInput;
  changes: ArrearChange[];
  monthlyRecords: MonthlyPaidRecord[];
  interestSettings?: ArrearsInterestSettings;
}

export interface ArrearMonthRow {
  month: string;
  daysInMonth: number;
  payableDays: number;
  salaryFactorPercent: number;
  salaryFactor: number;
  basicPay: number;
  daRate: number;
  da: number;
  hra: number;
  sbca: number;
  transportAllowance: number;
  otherEarnings: number;
  grossEntitlement: number;
  employeePension: number;
  professionalTax: number;
  gis: number;
  stampFee: number;
  incomeTaxTds: number;
  otherDeductions: number;
  employeeDeductions: number;
  revisedTakeHome: number;
  actualTakeHome: number | null;
  recovery: number;
  netArrears: number | null;
  interestDays: number;
  interestAmount: number;
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
  interestAmount: number;
  totalIncludingInterest: number | null;
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
  'manual-adjustment',
  'allowance-deduction'
]);

const NUMERIC_SALARY_FIELDS = [
  'basicPay', 'daRate', 'hraRate', 'hraMinimum', 'sbcaRate', 'cpsRate', 'cpsEmployerRate',
  'transportAllowance', 'otherEarnings', 'manualPension',
  'manualProfessionalTax', 'gis', 'stampFee', 'incomeTaxTds', 'otherDeductions'
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
  if (input.daRate > 300) errors.push('DA rate must be between 0% and 300%.');
  if (input.cpsRate > 100) errors.push('CPS/CPF employee rate must be between 0% and 100%.');
  if (input.cpsEmployerRate > 100) errors.push('CPS/CPF State contribution rate must be between 0% and 100%.');
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

const ALLOWED_SALARY_UPDATE_KEYS = new Set([
  'hraEligible', 'hraRate', 'hraMinimum', 'sbcaRate', 'cpsRate', 'cpsEmployerRate',
  'transportAllowance', 'otherEarnings', 'pensionMode', 'manualPension',
  'professionalTaxMode', 'manualProfessionalTax', 'gis', 'stampFee', 'incomeTaxTds', 'otherDeductions'
]);

function validateSalaryUpdate(update: ArrearSalaryUpdate, index: number): string[] {
  const errors: string[] = [];
  const entries = Object.entries(update);

  if (!entries.length) {
    errors.push('Change ' + (index + 1) + ': enter at least one allowance or deduction change.');
    return errors;
  }

  for (const [key, value] of entries) {
    if (!ALLOWED_SALARY_UPDATE_KEYS.has(key)) {
      errors.push('Change ' + (index + 1) + ': unsupported salary component ' + key + '.');
      continue;
    }

    if (key === 'hraEligible') {
      if (typeof value !== 'boolean') errors.push('Change ' + (index + 1) + ': HRA eligibility must be selected.');
      continue;
    }
    if (key === 'pensionMode') {
      if (!['cps', 'gpf', 'manual', 'none'].includes(String(value))) {
        errors.push('Change ' + (index + 1) + ': invalid pension arrangement.');
      }
      continue;
    }
    if (key === 'professionalTaxMode') {
      if (!['auto', 'manual', 'none'].includes(String(value))) {
        errors.push('Change ' + (index + 1) + ': invalid Professional Tax treatment.');
      }
      continue;
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      errors.push('Change ' + (index + 1) + ': ' + key + ' must be a non-negative number.');
      continue;
    }
    if (['hraRate', 'sbcaRate', 'cpsRate', 'cpsEmployerRate'].includes(key) && value > 100) {
      errors.push('Change ' + (index + 1) + ': ' + key + ' must not exceed 100%.');
    }
  }

  return errors;
}

function validateChange(change: ArrearChange, index: number, months: string[]): string[] {
  const errors: string[] = [];
  if (!months.includes(change.effectiveMonth)) {
    errors.push('Change ' + (index + 1) + ': effective month must be within the selected arrears period.');
  }
  if (change.payableFromMonth !== undefined) {
    if (!months.includes(change.payableFromMonth)) {
      errors.push('Change ' + (index + 1) + ': payable-from month must be within the selected arrears period.');
    }
    if (change.payableFromMonth < change.effectiveMonth) {
      errors.push('Change ' + (index + 1) + ': payable-from month cannot precede the notional effective month.');
    }
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
      (!Number.isFinite(change.daRate) || change.daRate < 0 || change.daRate > 300)) {
    errors.push('Change ' + (index + 1) + ': DA rate must be between 0% and 300%.');
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
  if (change.type === 'allowance-deduction') {
    if (change.salaryUpdates === undefined) {
      errors.push('Change ' + (index + 1) + ': add at least one allowance or deduction value.');
    } else {
      errors.push(...validateSalaryUpdate(change.salaryUpdates, index));
    }
  } else if (change.salaryUpdates !== undefined) {
    errors.push(...validateSalaryUpdate(change.salaryUpdates, index));
  }
  return errors;
}

function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function prorationInput(input: SalaryInput, factor: number): SalaryInput {
  return {
    ...input,
    basicPay: input.basicPay * factor,
    hraMinimum: input.hraMinimum * factor,
    transportAllowance: input.transportAllowance * factor,
    otherEarnings: input.otherEarnings * factor
  };
}

function calculateInterest(principal: number, annualRate: number, month: string, settlementDate: string): {
  days: number;
  amount: number;
} {
  const [year, monthNumber] = month.split('-').map(Number);
  const monthEnd = Date.UTC(year, monthNumber, 0);
  const settlement = Date.parse(settlementDate + 'T00:00:00.000Z');
  const days = Math.max(0, Math.floor((settlement - monthEnd) / 86_400_000));
  const amount = principal > 0 && annualRate > 0
    ? Math.floor((principal * annualRate * days / 36_500) + 0.5)
    : 0;
  return { days, amount };
}

function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[\u0000-\u0020]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function calculateArrears(input: ArrearsInput): ArrearsResult {
  const errors: string[] = [];
  const months = getArrearsMonthKeys(input.startMonth, input.endMonth);

  if (!months.length) {
    errors.push('Enter a valid period of no more than 60 consecutive months, with the end month on or after the start month.');
  }
  errors.push(...validateSalaryBasis(input.baseSalary));

  const interestSettings = input.interestSettings ?? { annualRate: 0, settlementDate: '' };
  if (!Number.isFinite(interestSettings.annualRate) || interestSettings.annualRate < 0 || interestSettings.annualRate > 50) {
    errors.push('Interest rate must be between 0% and 50%.');
  }
  if (interestSettings.annualRate > 0) {
    if (!validIsoDate(interestSettings.settlementDate)) {
      errors.push('Enter a valid settlement date when calculating interest.');
    } else if (months.length) {
      const lastMonth = months[months.length - 1];
      const lastDay = new Date(Date.UTC(
        Number(lastMonth.slice(0, 4)),
        Number(lastMonth.slice(5, 7)),
        0
      )).toISOString().slice(0, 10);
      if (interestSettings.settlementDate < lastDay) {
        errors.push('Interest settlement date must be on or after the final arrears month-end.');
      }
    }
  }
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
    if (record.payableDays !== undefined && record.payableDays !== null &&
        (!Number.isFinite(record.payableDays) || record.payableDays < 0 || record.payableDays > daysInMonth(record.month))) {
      errors.push('Paid record ' + (index + 1) + ': payable days must be between zero and the calendar days in that month.');
    }
    if (record.salaryFactorPercent !== undefined &&
        (!Number.isFinite(record.salaryFactorPercent) || record.salaryFactorPercent < 0 || record.salaryFactorPercent > 100)) {
      errors.push('Paid record ' + (index + 1) + ': salary factor must be between 0% and 100%.');
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
        netArrears: null,
        interestAmount: 0,
        totalIncludingInterest: null
      }
    };
  }

  const orderedChanges = input.changes
    .map((change, originalIndex) => ({
      change,
      originalIndex,
      payableMonth: change.payableFromMonth ?? change.effectiveMonth
    }))
    .sort((a, b) =>
      a.payableMonth.localeCompare(b.payableMonth) ||
      a.originalIndex - b.originalIndex
    );

  let salaryState: SalaryInput = { ...input.baseSalary };
  let nextChange = 0;
  const rows: ArrearMonthRow[] = [];

  for (const month of months) {
    const appliedChanges: string[] = [];
    while (
      nextChange < orderedChanges.length &&
      orderedChanges[nextChange].payableMonth <= month
    ) {
      const change = orderedChanges[nextChange].change;
      if (change.basicPay !== undefined) salaryState.basicPay = change.basicPay;
      if (change.daRate !== undefined) salaryState.daRate = change.daRate;
      if (change.salaryUpdates !== undefined) {
        salaryState = { ...salaryState, ...change.salaryUpdates };
      }
      appliedChanges.push(
        change.payableFromMonth && change.payableFromMonth !== change.effectiveMonth
          ? change.description + ' (notional ' + change.effectiveMonth + ', payable ' + change.payableFromMonth + ')'
          : change.description
      );
      nextChange += 1;
    }

    const paid = paidByMonth.get(month);
    const monthDays = daysInMonth(month);
    const payableDays = paid?.payableDays ?? monthDays;
    const salaryFactorPercent = paid?.salaryFactorPercent ?? 100;
    const payableFraction = (payableDays / monthDays) * (salaryFactorPercent / 100);
    const salary = calculateSalary(prorationInput(salaryState, payableFraction));
    const actualTakeHome = paid?.actualTakeHome ?? null;
    const recovery = paid?.recovery ?? 0;
    const netArrears = actualTakeHome === null
      ? null
      : salary.takeHome - actualTakeHome - recovery;
    const interest = interestSettings.annualRate > 0 && netArrears !== null
      ? calculateInterest(Math.max(0, netArrears), interestSettings.annualRate, month, interestSettings.settlementDate)
      : { days: 0, amount: 0 };

    rows.push({
      month,
      daysInMonth: monthDays,
      payableDays,
      salaryFactorPercent,
      salaryFactor: payableFraction,
      basicPay: salary.basicPay,
      daRate: salary.daRate,
      da: salary.da,
      hra: salary.hra,
      sbca: salary.sbca,
      transportAllowance: salary.transportAllowance,
      otherEarnings: salary.otherEarnings,
      grossEntitlement: salary.gross,
      employeePension: salary.employeePension,
      professionalTax: salary.professionalTax,
      gis: salary.gis,
      stampFee: salary.stampFee,
      incomeTaxTds: salary.incomeTaxTds,
      otherDeductions: salary.otherDeductions,
      employeeDeductions: salary.totalDeductions,
      revisedTakeHome: salary.takeHome,
      actualTakeHome,
      recovery,
      netArrears,
      interestDays: interest.days,
      interestAmount: interest.amount,
      appliedChanges
    });
  }

  const complete = rows.every((row) => row.actualTakeHome !== null);
  const totals: ArrearsTotals = rows.reduce<ArrearsTotals>((sum, row) => ({
    grossEntitlement: sum.grossEntitlement + row.grossEntitlement,
    employeeDeductions: sum.employeeDeductions + row.employeeDeductions,
    revisedTakeHome: sum.revisedTakeHome + row.revisedTakeHome,
    actualTakeHome: sum.actualTakeHome + (row.actualTakeHome ?? 0),
    recoveries: sum.recoveries + row.recovery,
    positiveArrears: sum.positiveArrears + (row.netArrears === null ? 0 : Math.max(0, row.netArrears)),
    negativeBalance: sum.negativeBalance + (row.netArrears === null ? 0 : Math.min(0, row.netArrears)),
    netArrears: sum.netArrears === null || row.netArrears === null
      ? null
      : sum.netArrears + row.netArrears,
    interestAmount: sum.interestAmount + row.interestAmount,
    totalIncludingInterest: sum.totalIncludingInterest === null || row.netArrears === null
      ? null
      : sum.totalIncludingInterest + row.netArrears + row.interestAmount
  }), {
    grossEntitlement: 0,
    employeeDeductions: 0,
    revisedTakeHome: 0,
    actualTakeHome: 0,
    recoveries: 0,
    positiveArrears: 0,
    negativeBalance: 0,
    netArrears: 0,
    interestAmount: 0,
    totalIncludingInterest: 0
  });

  return { valid: true, complete, errors: [], rows, totals };
}

export function createArrearsCsv(result: ArrearsResult): string {
  if (!result.valid || !result.complete || result.totals.netArrears === null) {
    throw new Error('Complete all actual credited salary entries before exporting the arrears statement.');
  }

  const rows = [
    ['Month', 'Calendar Days', 'Payable Days', 'Leave / Pay Factor (%)', 'Effective Pay Fraction (%)', 'Basic Pay (INR)', 'DA Rate (%)', 'DA (INR)', 'HRA (INR)', 'SBCA (INR)', 'Transport Allowance (INR)', 'Other Earnings (INR)', 'Revised Gross (INR)', 'Employee Pension / GPF (INR)', 'Professional Tax (INR)', 'Income Tax TDS (INR)', 'GIS (INR)', 'Stamp / Fixed Fee (INR)', 'Other Deductions (INR)', 'Total Employee Deductions (INR)', 'Revised Take-home (INR)', 'Actual Credited (INR)', 'Recovery from Arrears (INR)', 'Net Difference (INR)', 'Interest Days', 'Indicative Simple Interest (INR)', 'Effective change / order reference'],
    ...result.rows.map((row) => [
      row.month,
      row.daysInMonth,
      row.payableDays,
      row.salaryFactorPercent,
      row.salaryFactor * 100,
      row.basicPay,
      row.daRate,
      row.da,
      row.hra,
      row.sbca,
      row.transportAllowance,
      row.otherEarnings,
      row.grossEntitlement,
      row.employeePension,
      row.professionalTax,
      row.incomeTaxTds,
      row.gis,
      row.stampFee,
      row.otherDeductions,
      row.employeeDeductions,
      row.revisedTakeHome,
      row.actualTakeHome ?? '',
      row.recovery,
      row.netArrears ?? '',
      row.interestDays,
      row.interestAmount,
      row.appliedChanges.join('; ')
    ])
  ];

  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
