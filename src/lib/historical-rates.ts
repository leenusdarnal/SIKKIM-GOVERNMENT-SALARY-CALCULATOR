import type { SalaryInput } from './salary';

export type HistoricalRateComponent = 'daRate' | 'hraRate' | 'sbcaRate' | 'transportAllowance';
export type HistoricalRateUnit = 'percent' | 'inr';

export interface HistoricalRateEntry {
  component: HistoricalRateComponent;
  effectiveFrom: string;
  effectiveTo?: string;
  value: number;
  unit: HistoricalRateUnit;
  sourceReference: string;
  verified: boolean;
  applicability?: string;
}

export interface HistoricalRateResolution {
  month: string;
  values: Partial<Pick<SalaryInput, HistoricalRateComponent>>;
  applied: HistoricalRateEntry[];
  missing: HistoricalRateComponent[];
  errors: string[];
  complete: boolean;
}

const COMPONENTS: HistoricalRateComponent[] = ['daRate', 'hraRate', 'sbcaRate', 'transportAllowance'];
const isMonth = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const expectedUnit = (component: HistoricalRateComponent): HistoricalRateUnit =>
  component === 'transportAllowance' ? 'inr' : 'percent';

export function validateHistoricalRateSchedule(entries: HistoricalRateEntry[]): string[] {
  const errors: string[] = [];
  entries.forEach((entry, index) => {
    const label = 'Rate ' + (index + 1);
    if (!COMPONENTS.includes(entry.component)) {
      errors.push(label + ': unsupported salary component.');
      return;
    }
    if (!isMonth(entry.effectiveFrom)) errors.push(label + ': enter a valid effective-from month (YYYY-MM).');
    if (entry.effectiveTo !== undefined &&
        (!isMonth(entry.effectiveTo) || entry.effectiveTo < entry.effectiveFrom)) {
      errors.push(label + ': effective-to must be a valid month on or after effective-from.');
    }
    const maximum = componentMaximum(entry.component);
    if (!Number.isFinite(entry.value) || entry.value < 0 || entry.value > maximum) {
      errors.push(label + ': enter a valid non-negative value within the component limit.');
    }
    if (entry.unit !== expectedUnit(entry.component)) errors.push(label + ': unit must be ' + expectedUnit(entry.component) + '.');
    if (typeof entry.sourceReference !== 'string' || !entry.sourceReference.trim()) {
      errors.push(label + ': add the Government order / circular reference.');
    }
    if (entry.verified !== true) errors.push(label + ': confirm the source and employee applicability before using this rate.');
    if (entry.applicability !== undefined && typeof entry.applicability !== 'string') {
      errors.push(label + ': applicability note must be text.');
    }
  });

  const valid = entries.filter((entry) => COMPONENTS.includes(entry.component) &&
    isMonth(entry.effectiveFrom) &&
    (entry.effectiveTo === undefined || (isMonth(entry.effectiveTo) && entry.effectiveTo >= entry.effectiveFrom)));
  for (let i = 0; i < valid.length; i += 1) {
    for (let j = i + 1; j < valid.length; j += 1) {
      const a = valid[i], b = valid[j];
      if (a.component !== b.component) continue;
      const aEnd = a.effectiveTo ?? '9999-12', bEnd = b.effectiveTo ?? '9999-12';
      if (a.effectiveFrom <= bEnd && b.effectiveFrom <= aEnd) {
        errors.push('Overlapping effective periods for ' + a.component + ': ' + a.effectiveFrom + ' and ' + b.effectiveFrom + '.');
      }
    }
  }
  return [...new Set(errors)];
}

function componentMaximum(component: HistoricalRateComponent): number {
  return component === 'transportAllowance' ? Number.MAX_SAFE_INTEGER : 200;
}

/** Resolves only requested components. Gaps and unverified entries are never guessed or interpolated. */
export function resolveHistoricalRates(
  month: string,
  entries: HistoricalRateEntry[],
  requiredComponents: HistoricalRateComponent[] = COMPONENTS
): HistoricalRateResolution {
  const values: HistoricalRateResolution['values'] = {};
  const applied: HistoricalRateEntry[] = [];
  const missing: HistoricalRateComponent[] = [];
  const errors = !isMonth(month) ? ['Enter a valid month (YYYY-MM).'] : validateHistoricalRateSchedule(entries);
  if (!isMonth(month) || errors.length) {
    return { month, values, applied, missing: [...requiredComponents], errors, complete: false };
  }
  for (const component of requiredComponents) {
    const matches = entries.filter((entry) => entry.component === component && entry.verified === true &&
      entry.effectiveFrom <= month && (entry.effectiveTo === undefined || month <= entry.effectiveTo));
    if (matches.length !== 1) {
      missing.push(component);
      continue;
    }
    values[component] = matches[0].value;
    applied.push(matches[0]);
  }
  return { month, values, applied, missing, errors: [], complete: missing.length === 0 };
}

/** Applies a complete resolution to a copy; callers must not calculate from an incomplete result. */
export function applyHistoricalRates(base: SalaryInput, resolution: HistoricalRateResolution): SalaryInput {
  if (resolution.errors.length || !resolution.complete) {
    throw new Error('Historical rates are incomplete or invalid. Resolve every required component before calculating.');
  }
  return { ...base, ...resolution.values };
}
