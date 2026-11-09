import {
  getArrearsMonthKeys,
  type ArrearsInterestSettings,
  type ArrearsInput,
  type MonthlyPaidRecord
} from './arrears';
import type { SalaryInput } from './salary';

export const ARREARS_SCENARIO_VERSION = 1;
export const ARREARS_SCENARIO_STORAGE_KEY = 'sikkim-salary-arrears-scenario-v1';
export const MAX_ARREARS_BACKUP_BYTES = 2 * 1024 * 1024;

export interface ArrearsScenario extends ArrearsInput {
  version: typeof ARREARS_SCENARIO_VERSION;
  savedAt: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSalaryInput(value: unknown): value is SalaryInput {
  if (!isObject(value)) return false;
  const required = [
    'basicPay', 'daRate', 'hraRate', 'hraMinimum', 'sbcaRate', 'cpsRate', 'cpsEmployerRate',
    'transportAllowance', 'otherEarnings', 'manualPension', 'manualProfessionalTax',
    'gis', 'stampFee', 'incomeTaxTds', 'otherDeductions'
  ];
  return required.every((key) => typeof value[key] === 'number' && Number.isFinite(value[key]) && Number(value[key]) >= 0) &&
    Number(value.daRate) <= 200 &&
    Number(value.cpsRate) <= 100 &&
    Number(value.cpsEmployerRate) <= 100 &&
    Number(value.hraRate) <= 100 &&
    Number(value.sbcaRate) <= 100 &&
    typeof value.hraEligible === 'boolean' &&
    ['unselected', 'cps', 'gpf', 'manual', 'none'].includes(String(value.pensionMode)) &&
    ['unselected', 'auto', 'manual', 'none'].includes(String(value.professionalTaxMode));
}

function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function isMonthlyRecord(value: unknown): value is MonthlyPaidRecord {
  if (!isObject(value) || typeof value.month !== 'string') return false;
  return (value.actualTakeHome === null ||
      (typeof value.actualTakeHome === 'number' && Number.isFinite(value.actualTakeHome) && value.actualTakeHome >= 0)) &&
    typeof value.recovery === 'number' && Number.isFinite(value.recovery) && value.recovery >= 0 &&
    (value.payableDays === undefined || value.payableDays === null ||
      (typeof value.payableDays === 'number' && Number.isFinite(value.payableDays) &&
        value.payableDays >= 0 && value.payableDays <= daysInMonth(value.month))) &&
    (value.salaryFactorPercent === undefined ||
      (typeof value.salaryFactorPercent === 'number' && Number.isFinite(value.salaryFactorPercent) &&
        value.salaryFactorPercent >= 0 && value.salaryFactorPercent <= 100));
}

function isSalaryUpdate(value: unknown): boolean {
  if (!isObject(value)) return false;
  const numeric = [
    'hraRate', 'hraMinimum', 'sbcaRate', 'cpsRate', 'cpsEmployerRate',
    'transportAllowance', 'otherEarnings', 'manualPension',
    'manualProfessionalTax', 'incomeTaxTds', 'gis', 'stampFee', 'otherDeductions'
  ];
  const allowed = new Set([...numeric, 'hraEligible', 'pensionMode', 'professionalTaxMode']);
  for (const [key, entry] of Object.entries(value)) {
    if (!allowed.has(key)) return false;
    if (numeric.includes(key)) {
      if (typeof entry !== 'number' || !Number.isFinite(entry) || entry < 0) return false;
      if (['hraRate', 'sbcaRate', 'cpsRate', 'cpsEmployerRate'].includes(key) && entry > 100) return false;
    } else if (key === 'hraEligible') {
      if (typeof entry !== 'boolean') return false;
    } else if (key === 'pensionMode') {
      if (!['unselected', 'cps', 'gpf', 'manual', 'none'].includes(String(entry))) return false;
    } else if (key === 'professionalTaxMode') {
      if (!['unselected', 'auto', 'manual', 'none'].includes(String(entry))) return false;
    }
  }
  return true;
}

function isValidDate(value: string): boolean {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function createArrearsScenario(input: ArrearsInput, savedAt = new Date().toISOString()): ArrearsScenario {
  return {
    version: ARREARS_SCENARIO_VERSION,
    savedAt,
    startMonth: input.startMonth,
    endMonth: input.endMonth,
    baseSalary: { ...input.baseSalary },
    changes: input.changes.map((change) => ({
      ...change,
      ...(change.salaryUpdates ? { salaryUpdates: { ...change.salaryUpdates } } : {})
    })),
    monthlyRecords: input.monthlyRecords.map((record) => ({ ...record })),
    interestSettings: { ...(input.interestSettings ?? { annualRate: 0, settlementDate: '' }) }
  };
}

export function validateArrearsScenario(value: unknown): value is ArrearsScenario {
  if (!isObject(value) || value.version !== ARREARS_SCENARIO_VERSION) return false;
  if (typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt))) return false;
  if (typeof value.startMonth !== 'string' || typeof value.endMonth !== 'string') return false;
  if (!isSalaryInput(value.baseSalary) || !Array.isArray(value.changes) || !Array.isArray(value.monthlyRecords)) return false;
  const changeTypes = ['da-revision', 'annual-increment', 'promotion', 'pay-fixation', 'manual-adjustment', 'allowance-deduction'];
  if (!value.changes.every((change) => isObject(change) &&
      typeof change.effectiveMonth === 'string' &&
      changeTypes.includes(String(change.type)) &&
      typeof change.description === 'string' &&
      change.description.trim().length > 0 &&
      (change.basicPay === undefined || (typeof change.basicPay === 'number' && Number.isFinite(change.basicPay) && change.basicPay > 0)) &&
      (change.daRate === undefined || (typeof change.daRate === 'number' && Number.isFinite(change.daRate) && change.daRate >= 0 && change.daRate <= 300)) &&
      (change.payableFromMonth === undefined || typeof change.payableFromMonth === 'string') &&
      (change.salaryUpdates === undefined || isSalaryUpdate(change.salaryUpdates)))) return false;
  if (!value.monthlyRecords.every(isMonthlyRecord)) return false;

  const allowedMonths = new Set(getArrearsMonthKeys(value.startMonth, value.endMonth));
  if (!allowedMonths.size || !value.monthlyRecords.every((record) => allowedMonths.has(record.month))) return false;
  if (!value.changes.every((change) =>
      typeof change.effectiveMonth === 'string' &&
      allowedMonths.has(change.effectiveMonth) &&
      (change.payableFromMonth === undefined ||
        (typeof change.payableFromMonth === 'string' &&
          allowedMonths.has(change.payableFromMonth) &&
          change.payableFromMonth >= change.effectiveMonth)) &&
      typeof change.type === 'string' &&
      typeof change.description === 'string' &&
      (change.salaryUpdates === undefined || isObject(change.salaryUpdates)))) return false;

  const settings = value.interestSettings;
  if (settings !== undefined && (!isObject(settings) ||
      typeof settings.annualRate !== 'number' ||
      !Number.isFinite(settings.annualRate) ||
      settings.annualRate < 0 ||
      settings.annualRate > 50 ||
      typeof settings.settlementDate !== 'string')) return false;

  if (settings && settings.annualRate > 0) {
    if (!isValidDate(settings.settlementDate)) return false;
    const lastMonth = value.endMonth;
    const monthEnd = new Date(Date.UTC(
      Number(lastMonth.slice(0, 4)),
      Number(lastMonth.slice(5, 7)),
      0
    )).toISOString().slice(0, 10);
    if (settings.settlementDate < monthEnd) return false;
  }

  return true;
}

function encodedSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function serializeArrearsScenario(scenario: ArrearsScenario): string {
  if (!validateArrearsScenario(scenario)) {
    throw new Error('The arrears scenario is invalid and cannot be exported.');
  }
  const json = JSON.stringify(scenario, null, 2);
  if (encodedSize(json) > MAX_ARREARS_BACKUP_BYTES) {
    throw new Error('The arrears backup exceeds the 2 MB size limit.');
  }
  return json;
}

export function parseArrearsScenarioBackup(json: string): ArrearsScenario {
  if (encodedSize(json) > MAX_ARREARS_BACKUP_BYTES) {
    throw new Error('The selected backup exceeds the 2 MB size limit.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }
  if (!validateArrearsScenario(parsed)) {
    throw new Error('The JSON backup has an unsupported version or invalid salary / arrears data.');
  }
  return parsed;
}

export function saveArrearsScenario(input: ArrearsInput, storage: StorageLike): void {
  const scenario = createArrearsScenario(input);
  storage.setItem(ARREARS_SCENARIO_STORAGE_KEY, serializeArrearsScenario(scenario));
}

export function loadArrearsScenario(storage: StorageLike): ArrearsScenario | null {
  const raw = storage.getItem(ARREARS_SCENARIO_STORAGE_KEY);
  if (!raw) return null;
  try {
    return parseArrearsScenarioBackup(raw);
  } catch {
    return null;
  }
}

export function restoreArrearsScenario(json: string, storage: StorageLike): ArrearsScenario {
  const scenario = parseArrearsScenarioBackup(json);
  storage.setItem(ARREARS_SCENARIO_STORAGE_KEY, serializeArrearsScenario(scenario));
  return scenario;
}

export function createArrearsEntryTemplateCsv(months: string[]): string {
  const allowed = getArrearsMonthKeys(months[0] ?? '', months[months.length - 1] ?? '');
  if (!months.length || allowed.length !== months.length || allowed.some((month, index) => month !== months[index])) {
    throw new Error('Provide a valid consecutive month list to create the CSV template.');
  }
  const rows = [
    ['month', 'actualTakeHome', 'recovery', 'payableDays', 'salaryFactorPercent'],
    ...months.map((month) => [month, '', '0', '', '100'])
  ];
  return '\uFEFF' + rows.map((row) => row.join(',')).join('\r\n') + '\r\n';
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error('The CSV contains an unclosed quoted field.');
  cells.push(cell.trim());
  return cells;
}

export function parseArrearsEntryCsv(csv: string, allowedMonths: string[]): MonthlyPaidRecord[] {
  if (encodedSize(csv) > MAX_ARREARS_BACKUP_BYTES) {
    throw new Error('The CSV file exceeds the 2 MB size limit.');
  }
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) throw new Error('The CSV must contain a header and at least one month row.');

  const header = parseCsvLine(lines[0]).map((key) => key.toLowerCase());
  const required = ['month', 'actualtakehome', 'recovery', 'payabledays', 'salaryfactorpercent'];
  const indices = required.map((key) => header.indexOf(key));
  if (indices.some((index) => index < 0)) {
    throw new Error('The CSV header must contain month, actualTakeHome, recovery, payableDays and salaryFactorPercent.');
  }

  const allowed = new Set(allowedMonths);
  const seen = new Set<string>();
  const result: MonthlyPaidRecord[] = [];

  for (const [lineIndex, line] of lines.slice(1).entries()) {
    const cells = parseCsvLine(line);
    const month = cells[indices[0]] ?? '';
    if (!allowed.has(month)) throw new Error('CSV row ' + (lineIndex + 2) + ': month is outside the selected arrears period.');
    if (seen.has(month)) throw new Error('CSV row ' + (lineIndex + 2) + ': duplicate month ' + month + '.');
    seen.add(month);

    const numberAt = (index: number, label: string, blank: number | null): number | null => {
      const value = (cells[index] ?? '').trim();
      if (value === '') return blank;
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error('CSV row ' + (lineIndex + 2) + ': ' + label + ' must be a non-negative number.');
      }
      return parsed;
    };

    const actualTakeHome = numberAt(indices[1], 'actualTakeHome', null);
    const recovery = numberAt(indices[2], 'recovery', 0) ?? 0;
    const payableDays = numberAt(indices[3], 'payableDays', null);
    const salaryFactorPercent = numberAt(indices[4], 'salaryFactorPercent', 100) ?? 100;
    result.push({ month, actualTakeHome, recovery, payableDays, salaryFactorPercent });
  }

  return result;
}
