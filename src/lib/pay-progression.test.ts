import { describe, expect, it } from 'vitest';
import { calculateCellProgression, getIncrementDateOptions, getPayAtCell, validatePayHistory } from './pay-progression';

describe('Sikkim pay progression helpers', () => {
  it('reads only published cells from the official pay matrix', () => {
    expect(getPayAtCell(17, 1)).toBe(56_000);
    expect(getPayAtCell(17, 2)).toBe(57_700);
    expect(getPayAtCell(23, 18)).toBeNull();
  });
  it('requires explicit eligibility confirmation before applying an increment', () => {
    expect(calculateCellProgression(17, 1, 1, false)).toMatchObject({ basicPay: 56_000, nextCell: 1 });
    expect(calculateCellProgression(17, 1, 1, true)).toMatchObject({ basicPay: 57_700, nextCell: 2 });
  });
  it('supports multiple increments only while valid matrix cells exist', () => {
    expect(calculateCellProgression(17, 1, 2, true).basicPay).toBe(59_400);
    expect(calculateCellProgression(23, 17, 1, true).basicPay).toBeNull();
  });
  it('offers the two dates named in the Sikkim Revised Pay Rules', () => {
    expect(getIncrementDateOptions(2026)).toEqual(['2026-01-01', '2026-07-01']);
    expect(getIncrementDateOptions(2015)).toEqual([]);
  });
  it('validates chronological pay history and rejects nonexistent cells', () => {
    const result = validatePayHistory([
      { effectiveDate: '2024-01-01', event: 'appointment', level: 17, cell: 1 },
      { effectiveDate: '2025-01-01', event: 'annual-increment', level: 17, cell: 2 },
      { effectiveDate: '2024-07-01', event: 'promotion', level: 18, cell: 1 }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('chronological');
    expect(validatePayHistory([{ effectiveDate: '2026-01-01', event: 'annual-increment', level: 23, cell: 18 }]).valid).toBe(false);
  });
});
