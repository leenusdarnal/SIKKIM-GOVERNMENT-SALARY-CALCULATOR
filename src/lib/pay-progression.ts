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


export interface MatrixPlacementResult {
  valid: boolean;
  targetLevel: number;
  enteredBasicPay: number;
  cell: number | null;
  matrixBasicPay: number | null;
  differenceFromEntered: number | null;
  message: string;
}

/**
 * Finds the first published cell in a user-selected target level that is
 * equal to or greater than a fixation amount already established by the
 * competent authority. This is a matrix lookup only, not a pay-fixation rule.
 */
export function findNextMatrixCellAtOrAbove(
  targetLevel: number,
  enteredBasicPay: number
): MatrixPlacementResult {
  const invalid = (message: string): MatrixPlacementResult => ({
    valid: false,
    targetLevel,
    enteredBasicPay,
    cell: null,
    matrixBasicPay: null,
    differenceFromEntered: null,
    message
  });

  if (!Number.isInteger(targetLevel) || !PAY_MATRIX[targetLevel]) {
    return invalid('Select a valid Sikkim pay level from the published matrix.');
  }
  if (!Number.isFinite(enteredBasicPay) || enteredBasicPay <= 0) {
    return invalid('Enter the fixation basic pay confirmed in the applicable order or by the DDO.');
  }

  const cells = PAY_MATRIX[targetLevel];
  const index = cells.findIndex((amount) => amount >= enteredBasicPay);
  if (index < 0) {
    return invalid('The entered amount is above the final published cell for this level. No higher cell is available; do not extrapolate.');
  }

  const matrixBasicPay = cells[index];
  return {
    valid: true,
    targetLevel,
    enteredBasicPay,
    cell: index + 1,
    matrixBasicPay,
    differenceFromEntered: matrixBasicPay - enteredBasicPay,
    message: matrixBasicPay === enteredBasicPay
      ? 'An exact published pay-matrix cell matches the entered amount.'
      : 'The next published cell at or above the entered amount is shown for comparison. Confirm the prescribed placement with the DDO.'
  };
}
