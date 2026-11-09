import { describe, expect, it } from 'vitest';
import { validatePayHistory, type PayHistoryEntry } from './pay-progression';
import {
  createPayHistoryBackup,
  createPayHistoryCsv,
  parsePayHistoryBackup,
  readPayHistory,
  savePayHistory,
  PAY_HISTORY_STORAGE_KEY,
  type StorageLike
} from './pay-history-storage';

function createStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); }
  };
}

const sample: PayHistoryEntry[] = [
  { effectiveDate: '2024-01-01', event: 'appointment', level: 17, cell: 1, note: 'Appointment order 12/2024' },
  { effectiveDate: '2025-01-01', event: 'annual-increment', level: 17, cell: 2 }
];

describe('private pay-history storage and exports', () => {
  it('saves and restores a validated history from browser storage', () => {
    const storage = createStorage();
    expect(savePayHistory(sample, storage).ok).toBe(true);
    expect(storage.getItem(PAY_HISTORY_STORAGE_KEY)).toContain('"schemaVersion": 1');
    expect(readPayHistory(storage)).toMatchObject({ ok: true, entries: sample });
  });

  it('returns an empty history when no saved data exists', () => {
    expect(readPayHistory(createStorage())).toMatchObject({ ok: true, entries: [] });
  });

  it('reports malformed or unsupported saved data instead of silently accepting it', () => {
    const storage = createStorage({ [PAY_HISTORY_STORAGE_KEY]: '{bad json' });
    expect(readPayHistory(storage)).toMatchObject({ ok: false, entries: [] });
    expect(parsePayHistoryBackup('{}').ok).toBe(false);
  });

  it('round-trips a versioned backup and rejects invalid pay-matrix cells', () => {
    const backup = createPayHistoryBackup(sample);
    expect(parsePayHistoryBackup(backup)).toMatchObject({ ok: true, entries: sample });
    const invalid = JSON.stringify({
      schemaVersion: 1,
      entries: [{ effectiveDate: '2026-01-01', event: 'annual-increment', level: 23, cell: 18 }]
    });
    expect(parsePayHistoryBackup(invalid)).toMatchObject({ ok: false });
  });

  it('rejects unknown event types, invalid notes and oversized backups', () => {
    const badEvent = JSON.stringify({
      schemaVersion: 1,
      entries: [{ effectiveDate: '2026-01-01', event: 'salary-change', level: 17, cell: 1 }]
    });
    const badNote = JSON.stringify({
      schemaVersion: 1,
      entries: [{ effectiveDate: '2026-01-01', event: 'appointment', level: 17, cell: 1, note: 'x'.repeat(501) }]
    });
    expect(parsePayHistoryBackup(badEvent).ok).toBe(false);
    expect(parsePayHistoryBackup(badNote).ok).toBe(false);
    expect(parsePayHistoryBackup('x'.repeat(1_000_001)).ok).toBe(false);
  });

  it('does not save entries that fail chronology validation', () => {
    const storage = createStorage();
    const invalid = [sample[1], sample[0]];
    expect(validatePayHistory(invalid).valid).toBe(false);
    expect(savePayHistory(invalid, storage).ok).toBe(false);
    expect(storage.getItem(PAY_HISTORY_STORAGE_KEY)).toBeNull();
  });

  it('exports a quoted CSV and neutralises spreadsheet formula-like references', () => {
    const entries: PayHistoryEntry[] = [
      { effectiveDate: '2026-01-01', event: 'appointment', level: 17, cell: 1, note: '=HYPERLINK("https://example.com","open"), signed' }
    ];
    const csv = createPayHistoryCsv(entries);
    expect(csv).toContain("\"'=HYPERLINK(\"\"https://example.com\"\",\"\"open\"\"), signed\"");
    expect(csv).toContain('"Basic pay (INR)"');
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('gracefully handles blocked browser storage', () => {
    const blocked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); }
    };
    expect(readPayHistory(blocked).ok).toBe(false);
    expect(savePayHistory(sample, blocked).ok).toBe(false);
  });
});
