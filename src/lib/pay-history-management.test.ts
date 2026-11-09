import { describe, expect, it } from 'vitest';
import type { PayHistoryEntry } from './pay-progression';
import { deletePayHistoryEntry, editPayHistoryEntry } from './pay-history-management';

const entries: PayHistoryEntry[] = [
  { effectiveDate: '2024-01-01', event: 'appointment', level: 17, cell: 1, note: 'Appointment order' },
  { effectiveDate: '2025-01-01', event: 'annual-increment', level: 17, cell: 2 },
  { effectiveDate: '2026-01-01', event: 'annual-increment', level: 17, cell: 3 }
];

describe('pay history management', () => {
  it('edits an entry and keeps the history chronologically ordered', () => {
    const result = editPayHistoryEntry(entries, 2, {
      effectiveDate: '2024-07-01',
      event: 'promotion',
      level: 18,
      cell: 1,
      note: 'Promotion order'
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entries.map((entry) => entry.effectiveDate)).toEqual([
        '2024-01-01',
        '2024-07-01',
        '2025-01-01'
      ]);
      expect(result.entries[1]).toMatchObject({ event: 'promotion', level: 18, cell: 1 });
    }
  });

  it('retains stable ordering for entries with the same effective date', () => {
    const result = editPayHistoryEntry(entries, 1, {
      effectiveDate: '2024-01-01',
      event: 'promotion',
      level: 18,
      cell: 1
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entries.slice(0, 2).map((entry) => entry.event)).toEqual([
        'appointment',
        'promotion'
      ]);
    }
  });

  it('rejects an edit that selects a pay-matrix cell that does not exist', () => {
    const result = editPayHistoryEntry(entries, 1, {
      effectiveDate: '2025-01-01',
      event: 'promotion',
      level: 23,
      cell: 18
    });

    expect(result).toMatchObject({ ok: false });
  });

  it('rejects an invalid edit index and an overlong reference', () => {
    expect(editPayHistoryEntry(entries, 9, entries[0])).toMatchObject({ ok: false });
    expect(editPayHistoryEntry(entries, 0, { ...entries[0], note: 'x'.repeat(501) })).toMatchObject({ ok: false });
  });

  it('deletes only the selected entry', () => {
    const result = deletePayHistoryEntry(entries, 1);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.entries).toEqual([entries[0], entries[2]]);
    }
    expect(deletePayHistoryEntry(entries, -1)).toMatchObject({ ok: false });
  });

  it('does not mutate the original history while editing or deleting', () => {
    const before = structuredClone(entries);
    editPayHistoryEntry(entries, 0, { ...entries[0], note: 'Updated reference' });
    deletePayHistoryEntry(entries, 0);
    expect(entries).toEqual(before);
  });
});
