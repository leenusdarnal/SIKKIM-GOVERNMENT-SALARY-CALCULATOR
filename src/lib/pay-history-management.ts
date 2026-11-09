import { validatePayHistory, type PayHistoryEntry } from './pay-progression';

export type PayHistoryEditResult =
  | { ok: true; entries: PayHistoryEntry[] }
  | { ok: false; message: string };

/**
 * Replaces one entry and re-sorts by effective date. Stable ordering is retained
 * for entries that share the same effective date. The complete history is then
 * validated against the published matrix and chronology rules.
 */
export function editPayHistoryEntry(
  entries: PayHistoryEntry[],
  index: number,
  replacement: PayHistoryEntry
): PayHistoryEditResult {
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
    return { ok: false, message: 'The selected history entry no longer exists. Refresh the list and try again.' };
  }

  if (replacement.note && replacement.note.length > 500) {
    return { ok: false, message: 'The order / service-book reference must be 500 characters or fewer.' };
  }

  const candidate = entries.map((entry, entryIndex) =>
    entryIndex === index ? { ...replacement } : { ...entry }
  );

  const sorted = candidate
    .map((entry, originalIndex) => ({ entry, originalIndex }))
    .sort((a, b) =>
      a.entry.effectiveDate.localeCompare(b.entry.effectiveDate) ||
      a.originalIndex - b.originalIndex
    )
    .map(({ entry }) => entry);

  const validation = validatePayHistory(sorted);
  if (!validation.valid) {
    return { ok: false, message: validation.errors.join(' ') };
  }

  return { ok: true, entries: sorted };
}

export function deletePayHistoryEntry(entries: PayHistoryEntry[], index: number): PayHistoryEditResult {
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
    return { ok: false, message: 'The selected history entry no longer exists. Refresh the list and try again.' };
  }

  return {
    ok: true,
    entries: entries.filter((_, entryIndex) => entryIndex !== index)
  };
}
