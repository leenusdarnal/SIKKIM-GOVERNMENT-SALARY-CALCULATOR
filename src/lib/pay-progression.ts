import { PAY_MATRIX } from './data/pay-matrix';

export interface PayHistoryEntry {
  effectiveDate: string;
  event: 'appointment' | 'annual-increment' | 'promotion' | 'financial-upgradation' | 'regularisation' | 'manual-correction';
  level: number;
  cell: number;
  note?: string;
}
export interface PayHistoryRow extends PayHistoryEntry { basicPay: number; }

export function getPayAtCell(level: number, cell: number): number | null {
  if (!Number.isInteger(level) || !Number.isInteger(cell)) return null;
  return PAY_MATRIX[level]?.[cell - 1] ?? null;
}

/** Eligibility and effective date must be confirmed from the service record / applicable order. */
export function calculateCellProgression(level: number, currentCell: number, increments: number, eligible: boolean) {
  if (!eligible) return { basicPay: getPayAtCell(level, currentCell), nextCell: currentCell, message: 'No increment applied: eligibility has not been confirmed.' };
  if (!Number.isInteger(increments) || increments < 1) return { basicPay: null, nextCell: null, message: 'Enter at least one valid increment.' };
  const nextCell = currentCell + increments;
  const basicPay = getPayAtCell(level, nextCell);
  if (basicPay === null) return { basicPay: null, nextCell: null, message: 'The requested cell is outside the published pay matrix for this level.' };
  return { basicPay, nextCell, message: 'Calculated from published pay-matrix cells; confirm the effective date and service eligibility with the DDO.' };
}

export function getIncrementDateOptions(year: number): string[] {
  if (!Number.isInteger(year) || year < 2016 || year > 2200) return [];
  return [String(year) + '-01-01', String(year) + '-07-01'];
}

export function validatePayHistory(entries: PayHistoryEntry[]) {
  const errors: string[] = [];
  const rows: PayHistoryRow[] = [];
  let previousDate = '';
  for (const [index, entry] of entries.entries()) {
    const pay = getPayAtCell(entry.level, entry.cell);
    if (entry.effectiveDate.length !== 10 || entry.effectiveDate[4] !== '-' || entry.effectiveDate[7] !== '-' || Number.isNaN(Date.parse(entry.effectiveDate)) || new Date(entry.effectiveDate + 'T00:00:00Z').toISOString().slice(0, 10) !== entry.effectiveDate) {
      errors.push('Entry ' + (index + 1) + ': enter a valid effective date.');
      continue;
    }
    if (entry.effectiveDate < previousDate) errors.push('Entry ' + (index + 1) + ': entries must be in chronological order.');
    if (pay === null) {
      errors.push('Entry ' + (index + 1) + ': Level ' + entry.level + ', Cell ' + entry.cell + ' is not in the official pay matrix.');
      continue;
    }
    previousDate = entry.effectiveDate;
    rows.push({ ...entry, basicPay: pay });
  }
  return { valid: errors.length === 0, errors, rows };
}
