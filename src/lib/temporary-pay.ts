export type TemporaryPayCategory = 'group-c' | 'group-d' | 'specific-post' | 'training' | 'driver-manual';

export interface TemporaryPayOption {
  id: string;
  label: string;
  amount: number | null;
  category: TemporaryPayCategory;
  effectiveFrom: string;
  sourceReference: string;
  sourceUrl: string;
  note?: string;
  basis: 'monthly' | 'daily';
}

const CONSOLIDATED_SOURCE = 'Notification No. M(164)/42/GEN/DOP dated 12 August 2026';
const CONSOLIDATED_URL = 'https://dop.sikkim.gov.in/notificationdoc/M(164).pdf';
const TRAINING_SOURCE = 'Notification No. J(1)/86-GEN/DOP dated 25 July 2024';
const TRAINING_URL = 'https://dop.sikkim.gov.in/notificationdoc/J(1)86-GEN-DOP%20(Direct).pdf';

export const TEMPORARY_PAY_OPTIONS: TemporaryPayOption[] = [
  { id: 'gp-3800', label: 'Equivalent Grade Pay ₹3,800 / ₹4,200 — Inspector, Junior Engineer and equivalent posts', amount: 18_000, category: 'group-c', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'gp-3400', label: 'Equivalent Grade Pay ₹3,400 — Stenographer Grade III, Block Officer, Peshkar, Head Assistant and equivalent posts', amount: 15_000, category: 'group-c', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'gp-3000', label: 'Equivalent Grade Pay ₹3,000 — Computer Operator, Junior Village Administrative Assistant, IT Assistant and equivalent posts', amount: 12_000, category: 'group-c', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'gp-2600', label: 'Equivalent Grade Pay ₹2,600 — LDC, Panchayat Development Assistant, Accounts Clerk, Receptionist and equivalent posts', amount: 10_500, category: 'group-c', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'gp-2200', label: 'Equivalent Grade Pay ₹2,200 — Office Attendant and equivalent Group D posts', amount: 9_000, category: 'group-d', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'consultant-super-specialist', label: 'Consultant (Super Specialist)', amount: 250_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'professor-sgmc', label: 'Professor — Sikkim Government Medical College', amount: 250_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'associate-professor-sgmc', label: 'Associate Professor — Sikkim Government Medical College', amount: 220_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'assistant-professor-sgmc', label: 'Assistant Professor — Sikkim Government Medical College', amount: 180_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'specialist', label: 'Specialist', amount: 150_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'medical-officer-mbbs', label: 'Medical Officer (Doctor, MBBS)', amount: 55_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'medical-officer-ayush', label: 'Medical Officer (Ayush)', amount: 55_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'nmc-coordinator', label: 'NMC Coordinator — Sikkim Government Medical College', amount: 55_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'dental-surgeon', label: 'Dental Surgeon', amount: 35_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'legal-research-officer', label: 'Legal Officer / Research Officer', amount: 35_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'assistant-professor-education', label: 'Assistant Professor — Education Department', amount: 30_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'lecturer-diet', label: 'Lecturer — DIET', amount: 27_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'post-graduate-teacher', label: 'Post Graduate Teacher — Education Department', amount: 25_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'assistant-architect-engineer', label: 'Assistant Architect / Assistant Engineer', amount: 25_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'graduate-teacher', label: 'Graduate Teacher — Education Department', amount: 18_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'primary-computer-teacher', label: 'Primary Teacher / Computer Teacher — Education Department', amount: 15_000, category: 'specific-post', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'monthly' },
  { id: 'training-group-d-sikkim', label: 'Direct recruit training — Group D, within Sikkim', amount: 10_000, category: 'training', effectiveFrom: '2024-07-25', sourceReference: TRAINING_SOURCE, sourceUrl: TRAINING_URL, basis: 'monthly' },
  { id: 'training-group-d-outside', label: 'Direct recruit training — Group D, outside Sikkim', amount: 18_000, category: 'training', effectiveFrom: '2024-07-25', sourceReference: TRAINING_SOURCE, sourceUrl: TRAINING_URL, basis: 'monthly' },
  { id: 'training-group-c-sikkim', label: 'Direct recruit training — Group C, within Sikkim', amount: 12_000, category: 'training', effectiveFrom: '2024-07-25', sourceReference: TRAINING_SOURCE, sourceUrl: TRAINING_URL, basis: 'monthly' },
  { id: 'training-group-c-outside', label: 'Direct recruit training — Group C, outside Sikkim', amount: 20_000, category: 'training', effectiveFrom: '2024-07-25', sourceReference: TRAINING_SOURCE, sourceUrl: TRAINING_URL, basis: 'monthly' },
  { id: 'training-group-b-sikkim', label: 'Direct recruit training — Group B, within Sikkim', amount: 18_000, category: 'training', effectiveFrom: '2024-07-25', sourceReference: TRAINING_SOURCE, sourceUrl: TRAINING_URL, basis: 'monthly' },
  { id: 'training-group-b-outside', label: 'Direct recruit training — Group B, outside Sikkim', amount: 25_000, category: 'training', effectiveFrom: '2024-07-25', sourceReference: TRAINING_SOURCE, sourceUrl: TRAINING_URL, basis: 'monthly' },
  { id: 'driver-daily-wage', label: 'Driver on temporary post — Labour Department daily wage rate (manual)', amount: null, category: 'driver-manual', effectiveFrom: '2026-08-12', sourceReference: CONSOLIDATED_SOURCE, sourceUrl: CONSOLIDATED_URL, basis: 'daily', note: 'The DOP notification refers to the Labour Department-notified daily wage. It does not state the daily amount. Enter the rate from the applicable Labour Department notification and verify its effective date and category.' }
];

export interface TemporaryPayCalculationInput {
  optionId: string;
  salaryMonth: string;
  sourceVerified: boolean;
  payableDays?: number;
  dailyRate?: number;
  dailyRateSourceReference?: string;
  dailyRateEffectiveFrom?: string;
  dailyRateVerified?: boolean;
  /** Optional attendance/month length check. This does not prorate monthly consolidated pay. */
  daysInMonth?: number;
}

export interface TemporaryPayCalculation {
  valid: boolean;
  amount: number | null;
  option: TemporaryPayOption | null;
  basis: 'monthly' | 'daily' | null;
  errors: string[];
  sourceReference: string | null;
}

const validIsoDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) &&
  new Date(value + 'T00:00:00.000Z').toISOString().slice(0, 10) === value;

export function calculateTemporaryPay(input: TemporaryPayCalculationInput): TemporaryPayCalculation {
  const option = TEMPORARY_PAY_OPTIONS.find((item) => item.id === input.optionId) ?? null;
  const errors: string[] = [];
  if (!option) errors.push('Select a valid temporary-pay category or post.');
  if (!/^\d{4}-\d{2}$/.test(input.salaryMonth) || !validIsoDate(input.salaryMonth + '-01')) {
    errors.push('Enter a valid salary month in YYYY-MM format.');
  }
  if (option && validIsoDate(input.salaryMonth + '-01') && input.salaryMonth + '-01' < option.effectiveFrom) {
    errors.push('The selected notification rate is not effective for the selected salary month.');
  }
  if (option && (!option.sourceReference.trim() || !/^https:\/\//.test(option.sourceUrl))) {
    errors.push('The schedule source reference or official source link is missing.');
  }
  if (input.sourceVerified !== true) errors.push('Confirm that the cited Government notification applies to this employee, post and salary period.');
  if (option?.basis === 'monthly' && option.amount !== null) {
    if (input.daysInMonth !== undefined && (!Number.isInteger(input.daysInMonth) || input.daysInMonth < 28 || input.daysInMonth > 31 || input.daysInMonth !== new Date(Number(input.salaryMonth.slice(0, 4)), Number(input.salaryMonth.slice(5, 7)), 0).getDate())) {
      errors.push('Days in month must match the selected calendar month.');
    }
    if (input.payableDays !== undefined && (!Number.isInteger(input.payableDays) || input.payableDays < 1 || (input.daysInMonth !== undefined && input.payableDays > input.daysInMonth))) {
      errors.push('Payable days must be a whole number within the selected month.');
    }
    if (input.payableDays !== undefined && input.daysInMonth !== undefined && input.payableDays !== input.daysInMonth) {
      errors.push('The notification provides a monthly consolidated amount; partial-month proration is not implemented without an applicable order or DDO-approved formula.');
    }
  }
  if (option?.basis === 'daily') {
    if (!Number.isFinite(input.dailyRate) || (input.dailyRate ?? 0) <= 0) errors.push('Enter the positive daily rate from the applicable Labour Department notification.');
    if (!Number.isInteger(input.payableDays) || (input.payableDays ?? 0) < 1) errors.push('Enter at least one payable day.');
    if (input.daysInMonth !== undefined && (!Number.isInteger(input.daysInMonth) || input.daysInMonth < 28 || input.daysInMonth > 31 || input.daysInMonth !== new Date(Number(input.salaryMonth.slice(0, 4)), Number(input.salaryMonth.slice(5, 7)), 0).getDate())) errors.push('Days in month must match the selected calendar month.');
    if (input.daysInMonth !== undefined && (input.payableDays ?? 0) > input.daysInMonth) errors.push('Payable days cannot exceed the number of calendar days in the selected month.');
    if (!input.dailyRateSourceReference?.trim()) errors.push('Enter the Labour Department notification number/date for the daily rate.');
    if (!validIsoDate(input.dailyRateEffectiveFrom ?? '')) errors.push('Enter the effective date of the Labour Department daily-rate notification.');
    if (input.dailyRateEffectiveFrom && validIsoDate(input.salaryMonth + '-01') && validIsoDate(input.dailyRateEffectiveFrom) && input.dailyRateEffectiveFrom > input.salaryMonth + '-01') errors.push('The Labour Department daily rate is not yet effective for the selected salary month.');
    if (input.dailyRateVerified !== true) errors.push('Confirm that the Labour Department daily rate applies to the employee, category and selected month.');
  }
  const valid = errors.length === 0;
  const amount = valid && option
    ? option.basis === 'daily'
      ? Math.round((input.dailyRate as number) * (input.payableDays as number))
      : option.amount
    : null;
  return {
    valid,
    amount,
    option,
    basis: option?.basis ?? null,
    errors,
    sourceReference: option?.sourceReference ?? null
  };
}

/** Compatibility helper for callers that only need a catalogue lookup; it is not a validated payroll calculation. */
export function getTemporaryPay(optionId: string, payableDays?: number, dailyRate?: number): number | null {
  const option = TEMPORARY_PAY_OPTIONS.find((item) => item.id === optionId);
  if (!option) return null;
  if (option.basis === 'monthly') return option.amount;
  if (!Number.isFinite(payableDays) || !Number.isFinite(dailyRate) || (payableDays ?? 0) < 1 || (dailyRate ?? 0) <= 0) return null;
  return Math.round((payableDays as number) * (dailyRate as number));
}
