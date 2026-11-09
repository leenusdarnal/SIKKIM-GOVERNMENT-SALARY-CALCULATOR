import { validatePayHistory, type PayHistoryEntry } from './pay-progression';

export const PAY_HISTORY_STORAGE_KEY = 'sikkim-salary-pay-history:v1';

const BACKUP_VERSION = 1;
const MAX_BACKUP_CHARACTERS = 1_000_000;
const MAX_HISTORY_ENTRIES = 500;
const MAX_NOTE_LENGTH = 500;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type BackupParseResult =
  | { ok: true; entries: PayHistoryEntry[] }
  | { ok: false; message: string };

export interface PayHistoryStorageResult {
  ok: boolean;
  entries: PayHistoryEntry[];
  message: string;
}

const EVENTS = new Set<PayHistoryEntry['event']>([
  'appointment',
  'annual-increment',
  'promotion',
  'financial-upgradation',
  'regularisation',
  'manual-correction'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPayHistoryEntry(value: unknown): value is PayHistoryEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.effectiveDate === 'string' &&
    typeof value.event === 'string' &&
    EVENTS.has(value.event as PayHistoryEntry['event']) &&
    Number.isInteger(value.level) &&
    Number.isInteger(value.cell) &&
    (value.note === undefined || (typeof value.note === 'string' && value.note.length <= MAX_NOTE_LENGTH))
  );
}

function validateEntries(entries: PayHistoryEntry[]): string | null {
  if (entries.length > MAX_HISTORY_ENTRIES) {
    return 'A backup can contain no more than 500 history entries.';
  }
  const validation = validatePayHistory(entries);
  return validation.valid ? null : validation.errors.join(' ');
}

export function parsePayHistoryBackup(raw: string): BackupParseResult {
  if (raw.length > MAX_BACKUP_CHARACTERS) {
    return { ok: false, message: 'The backup file is too large to import.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: 'The selected file is not valid JSON.' };
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== BACKUP_VERSION || !Array.isArray(parsed.entries)) {
    return { ok: false, message: 'This is not a supported Sikkim Salary Calculator pay-history backup.' };
  }

  if (!parsed.entries.every(isPayHistoryEntry)) {
    return { ok: false, message: 'The backup contains an entry with an invalid field or unsupported event.' };
  }

  const entries = parsed.entries.map((entry) => ({
    effectiveDate: entry.effectiveDate,
    event: entry.event,
    level: entry.level,
    cell: entry.cell,
    ...(entry.note === undefined ? {} : { note: entry.note })
  }));

  const validationError = validateEntries(entries);
  if (validationError) return { ok: false, message: validationError };
  return { ok: true, entries };
}

export function createPayHistoryBackup(entries: PayHistoryEntry[]): string {
  const validationError = validateEntries(entries);
  if (validationError) throw new Error(validationError);

  return JSON.stringify(
    {
      application: 'Sikkim Government Salary Calculator',
      schemaVersion: BACKUP_VERSION,
      entries
    },
    null,
    2
  );
}

export function readPayHistory(storage: StorageLike): PayHistoryStorageResult {
  try {
    const raw = storage.getItem(PAY_HISTORY_STORAGE_KEY);
    if (raw === null) {
      return { ok: true, entries: [], message: 'No saved service history was found in this browser.' };
    }

    const parsed = parsePayHistoryBackup(raw);
    if (!parsed.ok) {
      return { ok: false, entries: [], message: 'Saved history was not loaded: ' + parsed.message };
    }

    return {
      ok: true,
      entries: parsed.entries,
      message: parsed.entries.length
        ? parsed.entries.length + ' saved history ' + (parsed.entries.length === 1 ? 'entry' : 'entries') + ' restored from this browser.'
        : 'No saved service history was found in this browser.'
    };
  } catch {
    return {
      ok: false,
      entries: [],
      message: 'Browser storage is unavailable. You can still use the history during this visit and export a backup.'
    };
  }
}

export function savePayHistory(entries: PayHistoryEntry[], storage: StorageLike): PayHistoryStorageResult {
  const validationError = validateEntries(entries);
  if (validationError) return { ok: false, entries, message: 'History was not saved: ' + validationError };

  try {
    storage.setItem(PAY_HISTORY_STORAGE_KEY, createPayHistoryBackup(entries));
    return {
      ok: true,
      entries,
      message: 'Saved in this browser only. Export a JSON backup before clearing browser data or changing devices.'
    };
  } catch {
    return {
      ok: false,
      entries,
      message: 'Browser storage is full or unavailable. Export a backup to keep these entries.'
    };
  }
}

function csvCell(value: string | number): string {
  let text = String(value);
  // Prefix formula-like values to prevent spreadsheet formula execution when CSV is opened.
  if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function createPayHistoryCsv(entries: PayHistoryEntry[]): string {
  const validation = validatePayHistory(entries);
  if (!validation.valid) throw new Error(validation.errors.join(' '));

  const rows = [
    ['Effective date', 'Event', 'Pay level', 'Cell', 'Basic pay (INR)', 'Order / service-book reference'],
    ...validation.rows.map((row) => [
      row.effectiveDate,
      row.event,
      row.level,
      row.cell,
      row.basicPay,
      row.note ?? ''
    ])
  ];

  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
