import {
  getArrearsMonthKeys,
  type ArrearsInput,
  type ArrearChange,
  type MonthlyPaidRecord
} from './arrears';
import type { SalaryInput } from './salary';
import type { HistoricalRateComponent, HistoricalRateEntry } from './historical-rates';

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

const NUMERIC_SALARY_FIELDS = [
  'basicPay', 'daRate', 'hraRate', 'hraMinimum', 'sbcaRate',
  'transportAllowance', 'otherEarnings', 'manualPension', 'manualProfessionalTax',
  'gis', 'stampFee', 'otherDeductions'
] as const;

function isSalaryInput(value: unknown): value is SalaryInput {
  if (!isObject(value)) return false;
  return NUMERIC_SALARY_FIELDS.every((key) =>
    typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] >= 0
  ) &&
    typeof value.hraEligible === 'boolean' &&
    ['unselected', 'cps', 'gpf', 'manual', 'none'].includes(String(value.pensionMode)) &&
    ['unselected', 'auto', 'manual', 'none'].includes(String(value.professionalTaxMode)) &&
    ['unselected', 'below-level-15', 'level-15-and-above'].includes(String(value.professionalTaxLevelBand));
}

const CHANGE_TYPES = new Set([
  'da-revision', 'annual-increment', 'promotion', 'pay-fixation',
  'manual-adjustment', 'allowance-deduction'
]);

const SALARY_UPDATE_KEYS = new Set([
  'hraEligible', 'hraRate', 'hraMinimum', 'sbcaRate',
  'transportAllowance', 'otherEarnings', 'pensionMode', 'manualPension',
  'professionalTaxMode', 'professionalTaxLevelBand', 'manualProfessionalTax', 'gis', 'stampFee', 'otherDeductions'
]);

function isSalaryUpdate(value: unknown): boolean {
  if (!isObject(value) || Object.keys(value).length === 0) return false;
  return Object.entries(value).every(([key, item]) => {
    if (!SALARY_UPDATE_KEYS.has(key)) return false;
    if (key === 'hraEligible') return typeof item === 'boolean';
    if (key === 'pensionMode') return ['cps', 'gpf', 'manual', 'none'].includes(String(item));
    if (key === 'professionalTaxMode') return ['auto', 'manual', 'none'].includes(String(item));
    if (key === 'professionalTaxLevelBand') return ['unselected', 'below-level-15', 'level-15-and-above'].includes(String(item));
    return typeof item === 'number' && Number.isFinite(item) && item >= 0 &&
      (!['hraRate', 'sbcaRate'].includes(key) || item <= 100);
  });
}

function isChange(value: unknown, months: string[]): value is ArrearChange {
  if (!isObject(value) || typeof value.effectiveMonth !== 'string' ||
      !months.includes(value.effectiveMonth) || typeof value.type !== 'string' ||
      !CHANGE_TYPES.has(value.type) || typeof value.description !== 'string' ||
      !value.description.trim()) return false;
  if (value.basicPay !== undefined &&
      (typeof value.basicPay !== 'number' || !Number.isFinite(value.basicPay) || value.basicPay <= 0)) return false;
  if (value.daRate !== undefined &&
      (typeof value.daRate !== 'number' || !Number.isFinite(value.daRate) || value.daRate < 0 || value.daRate > 200)) return false;
  if (value.type === 'da-revision' && value.daRate === undefined) return false;
  if (['annual-increment', 'promotion', 'pay-fixation'].includes(value.type) && value.basicPay === undefined) return false;
  if (value.type === 'manual-adjustment' && value.basicPay === undefined && value.daRate === undefined) return false;
  if (value.type === 'allowance-deduction' && value.salaryUpdates === undefined) return false;
  return value.salaryUpdates === undefined || isSalaryUpdate(value.salaryUpdates);
}

function isMonthlyRecord(value: unknown, months: string[]): value is MonthlyPaidRecord {
  if (!isObject(value) || typeof value.month !== 'string' || !months.includes(value.month)) return false;
  return (value.actualTakeHome === null ||
    (typeof value.actualTakeHome === 'number' && Number.isFinite(value.actualTakeHome) && value.actualTakeHome >= 0)) &&
    typeof value.recovery === 'number' && Number.isFinite(value.recovery) && value.recovery >= 0;
}

function isHistoricalRateEntry(value: unknown): value is HistoricalRateEntry {
  if (!isObject(value)) return false;
  const components = ['daRate', 'hraRate', 'sbcaRate', 'transportAllowance'];
  const component = String(value.component);
  const validMonth = (v: unknown) => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
  const expectedUnit = component === 'transportAllowance' ? 'inr' : 'percent';
  const maximum = component === 'daRate' ? 200 : component === 'transportAllowance' ? Number.MAX_SAFE_INTEGER : 100;
  return components.includes(component) && validMonth(value.effectiveFrom) &&
    (value.effectiveTo === undefined || (validMonth(value.effectiveTo) && String(value.effectiveTo) >= String(value.effectiveFrom))) &&
    typeof value.value === 'number' && Number.isFinite(value.value) && value.value >= 0 &&
    value.value <= maximum && value.unit === expectedUnit &&
    typeof value.sourceReference === 'string' && typeof value.verified === 'boolean' &&
    (value.applicability === undefined || typeof value.applicability === 'string');
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
    ...(input.historicalRateSchedule === undefined ? {} : {
      historicalRateSchedule: input.historicalRateSchedule.map((entry) => ({ ...entry }))
    }),
    ...(input.historicalRateComponents === undefined ? {} : {
      historicalRateComponents: [...input.historicalRateComponents]
    })
  };
}

/** Structural validation deliberately accepts incomplete salary drafts (for example, before pension mode is selected). */
export function validateArrearsScenario(value: unknown): value is ArrearsScenario {
  if (!isObject(value) || value.version !== ARREARS_SCENARIO_VERSION) return false;
  if (typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt))) return false;
  if (typeof value.startMonth !== 'string' || typeof value.endMonth !== 'string') return false;
  const months = getArrearsMonthKeys(value.startMonth, value.endMonth);
  if (!months.length || !isSalaryInput(value.baseSalary) ||
      !Array.isArray(value.changes) || !Array.isArray(value.monthlyRecords)) return false;
  if (!value.changes.every((change) => isChange(change, months))) return false;
  if (!value.monthlyRecords.every((record) => isMonthlyRecord(record, months))) return false;
  const paidMonths = (value.monthlyRecords as MonthlyPaidRecord[]).map((record) => record.month);
  if (new Set(paidMonths).size !== paidMonths.length) return false;
  if ((value.historicalRateSchedule === undefined) !== (value.historicalRateComponents === undefined)) return false;
  if (value.historicalRateSchedule !== undefined) {
    if (!Array.isArray(value.historicalRateSchedule) || !value.historicalRateSchedule.every(isHistoricalRateEntry)) return false;
  }
  if (value.historicalRateComponents !== undefined) {
    const allowed: HistoricalRateComponent[] = ['daRate', 'hraRate', 'sbcaRate', 'transportAllowance'];
    if (!Array.isArray(value.historicalRateComponents) ||
        !value.historicalRateComponents.every((item) => allowed.includes(item as HistoricalRateComponent)) ||
        new Set(value.historicalRateComponents).size !== value.historicalRateComponents.length) return false;
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

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
}

export function createArrearsEntryTemplateCsv(months: string[]): string {
  const allowed = getArrearsMonthKeys(months[0] ?? '', months[months.length - 1] ?? '');
  if (!months.length || allowed.length !== months.length || allowed.some((month, index) => month !== months[index])) {
    throw new Error('Provide a valid consecutive month list to create the CSV template.');
  }
  const rows = [
    ['month', 'actualTakeHome', 'recovery'],
    ...months.map((month) => [month, '', '0'])
  ];
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
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
  const required = ['month', 'actualtakehome', 'recovery'];
  const indices = required.map((key) => header.indexOf(key));
  if (indices.some((index) => index < 0)) {
    throw new Error('The CSV header must contain month, actualTakeHome and recovery.');
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
    result.push({ month, actualTakeHome, recovery });
  }
  return result;
}
