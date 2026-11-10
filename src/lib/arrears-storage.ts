import {
  calculateArrears,
  getArrearsMonthKeys,
  type ArrearsInput,
  type MonthlyPaidRecord
} from './arrears';
import type { SalaryInput } from './salary';

export const ARREARS_SCENARIO_VERSION = 1;
export const ARREARS_SCENARIO_STORAGE_KEY = 'sikkim-salary-arrears-scenario-v1';
export const MAX_ARREARS_BACKUP_BYTES = 1_000_000;

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
  const numericFields = [
    'basicPay', 'daRate', 'hraRate', 'hraMinimum', 'sbcaRate',
    'transportAllowance', 'otherEarnings', 'manualPension',
    'manualProfessionalTax', 'gis', 'stampFee', 'otherDeductions'
  ];
  return numericFields.every((key) => typeof value[key] === 'number' && Number.isFinite(value[key])) &&
    typeof value.hraEligible === 'boolean' &&
    ['unselected', 'cps', 'gpf', 'manual', 'none'].includes(String(value.pensionMode)) &&
    ['unselected', 'auto', 'manual', 'none'].includes(String(value.professionalTaxMode));
}

function isMonthlyRecord(value: unknown): value is MonthlyPaidRecord {
  return isObject(value) &&
    typeof value.month === 'string' &&
    (value.actualTakeHome === null || (typeof value.actualTakeHome === 'number' && Number.isFinite(value.actualTakeHome))) &&
    typeof value.recovery === 'number' && Number.isFinite(value.recovery);
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
    monthlyRecords: input.monthlyRecords.map((record) => ({ ...record }))
  };
}

export function validateArrearsScenario(value: unknown): value is ArrearsScenario {
  if (!isObject(value) || value.version !== ARREARS_SCENARIO_VERSION) return false;
  if (typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt))) return false;
  if (typeof value.startMonth !== 'string' || typeof value.endMonth !== 'string') return false;
  if (!isSalaryInput(value.baseSalary) || !Array.isArray(value.changes) || !Array.isArray(value.monthlyRecords)) return false;
  if (!value.changes.every((change) => isObject(change) &&
      typeof change.effectiveMonth === 'string' &&
      typeof change.type === 'string' &&
      typeof change.description === 'string')) return false;
  if (!value.monthlyRecords.every(isMonthlyRecord)) return false;

  const input: ArrearsInput = {
    startMonth: value.startMonth,
    endMonth: value.endMonth,
    baseSalary: value.baseSalary,
    changes: value.changes as ArrearsInput['changes'],
    monthlyRecords: value.monthlyRecords
  };
  return calculateArrears(input).valid;
}

function encodedSize(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function serializeArrearsScenario(scenario: ArrearsScenario): string {
  if (!validateArrearsScenario(scenario)) {
    throw new Error('The arrears scenario is invalid and cannot be exported.');
  }
  const json = JSON.stringify(scenario, null, 2);
  if (encodedSize(json) > MAX_ARREARS_BACKUP_BYTES) {
    throw new Error('The arrears backup exceeds the 1 MB size limit.');
  }
  return json;
}

export function parseArrearsScenarioBackup(json: string): ArrearsScenario {
  if (encodedSize(json) > MAX_ARREARS_BACKUP_BYTES) {
    throw new Error('The selected backup exceeds the 1 MB size limit.');
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
  storage.setItem(ARREARS_SCENARIO_STORAGE_KEY, serializeArrearsScenario(createArrearsScenario(input)));
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
  const expected = getArrearsMonthKeys(months[0] ?? '', months[months.length - 1] ?? '');
  if (!months.length || expected.length !== months.length || expected.some((month, index) => month !== months[index])) {
    throw new Error('Provide a valid consecutive month list to create the CSV template.');
  }
  const rows = [
    ['month', 'actualTakeHome', 'recovery'],
    ...months.map((month) => [month, '', '0'])
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
  if (encodedSize(csv) > MAX_ARREARS_BACKUP_BYTES) throw new Error('The CSV file exceeds the 1 MB size limit.');
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) throw new Error('The CSV must contain a header and at least one month row.');
  const header = parseCsvLine(lines[0]).map((key) => key.toLowerCase());
  const required = ['month', 'actualtakehome', 'recovery'];
  const indices = required.map((key) => header.indexOf(key));
  if (indices.some((index) => index < 0)) throw new Error('The CSV header must contain month, actualTakeHome and recovery.');

  const allowed = new Set(allowedMonths);
  const seen = new Set<string>();
  const records: MonthlyPaidRecord[] = [];
  for (const [lineIndex, line] of lines.slice(1).entries()) {
    const cells = parseCsvLine(line);
    const month = cells[indices[0]] ?? '';
    if (!allowed.has(month)) throw new Error('CSV row ' + (lineIndex + 2) + ': month is outside the selected arrears period.');
    if (seen.has(month)) throw new Error('CSV row ' + (lineIndex + 2) + ': duplicate month ' + month + '.');
    seen.add(month);
    const parseAmount = (index: number, label: string, blank: number | null): number | null => {
      const raw = (cells[index] ?? '').trim();
      if (!raw) return blank;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) throw new Error('CSV row ' + (lineIndex + 2) + ': ' + label + ' must be a non-negative number.');
      return value;
    };
    records.push({
      month,
      actualTakeHome: parseAmount(indices[1], 'actualTakeHome', null),
      recovery: parseAmount(indices[2], 'recovery', 0) ?? 0
    });
  }
  return records;
}
