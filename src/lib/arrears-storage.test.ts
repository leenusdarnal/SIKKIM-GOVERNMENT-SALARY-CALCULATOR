import { describe, expect, it } from 'vitest';
import { DEFAULT_SALARY_INPUT } from './salary';
import { getArrearsMonthKeys, type ArrearsInput } from './arrears';
import type { HistoricalRateEntry } from './historical-rates';
import {
  createArrearsEntryTemplateCsv,
  createArrearsScenario,
  loadArrearsScenario,
  parseArrearsEntryCsv,
  parseArrearsScenarioBackup,
  restoreArrearsScenario,
  saveArrearsScenario,
  serializeArrearsScenario,
  validateArrearsScenario,
  ARREARS_SCENARIO_STORAGE_KEY,
  type StorageLike
} from './arrears-storage';

function input(): ArrearsInput {
  return {
    startMonth: '2026-01',
    endMonth: '2026-03',
    baseSalary: {
      ...DEFAULT_SALARY_INPUT,
      basicPay: 56_000,
      daRate: 58,
      pensionMode: 'cps',
      professionalTaxMode: 'auto'
    },
    changes: [],
    monthlyRecords: [
      { month: '2026-01', actualTakeHome: 50_000, recovery: 0 },
      { month: '2026-02', actualTakeHome: null, recovery: 0 },
      { month: '2026-03', actualTakeHome: 50_000, recovery: 0 }
    ]
  };
}

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('arrears draft storage and import/export', () => {
  it('creates and round-trips a versioned JSON scenario backup', () => {
    const scenario = createArrearsScenario(input(), '2026-11-09T00:00:00.000Z');
    const json = serializeArrearsScenario(scenario);
    const restored = parseArrearsScenarioBackup(json);
    expect(restored.version).toBe(1);
    expect(restored.startMonth).toBe('2026-01');
    expect(restored.monthlyRecords).toHaveLength(3);
    expect(validateArrearsScenario(restored)).toBe(true);
  });

  it('allows incomplete but structurally safe drafts to be saved', () => {
    const draft = createArrearsScenario({
      ...input(),
      baseSalary: { ...DEFAULT_SALARY_INPUT, basicPay: 0, pensionMode: 'unselected', professionalTaxMode: 'unselected' }
    });
    expect(validateArrearsScenario(draft)).toBe(true);
    expect(() => serializeArrearsScenario(draft)).not.toThrow();
  });

  it('rejects corrupt, unsupported-version and structurally invalid backups', () => {
    expect(() => parseArrearsScenarioBackup('{bad')).toThrow(/valid JSON/);
    expect(() => parseArrearsScenarioBackup(JSON.stringify({ version: 999 }))).toThrow(/unsupported version/);
    const invalid = createArrearsScenario(input());
    invalid.endMonth = '2026-15';
    expect(validateArrearsScenario(invalid)).toBe(false);
  });

  it('saves, loads and restores the scenario locally', () => {
    const store = new MemoryStorage();
    saveArrearsScenario(input(), store);
    expect(store.getItem(ARREARS_SCENARIO_STORAGE_KEY)).not.toBeNull();
    expect(loadArrearsScenario(store)?.startMonth).toBe('2026-01');
    store.setItem(ARREARS_SCENARIO_STORAGE_KEY, 'corrupt');
    expect(loadArrearsScenario(store)).toBeNull();
    const restored = restoreArrearsScenario(serializeArrearsScenario(createArrearsScenario(input())), store);
    expect(restored.monthlyRecords).toHaveLength(3);
    expect(loadArrearsScenario(store)?.monthlyRecords).toHaveLength(3);
  });

  it('round-trips Sikkim Professional Tax pay-level changes in saved drafts', () => {
    const scenario = createArrearsScenario({
      ...input(),
      baseSalary: {
        ...input().baseSalary,
        professionalTaxLevelBand: 'below-level-15'
      },
      changes: [{
        effectiveMonth: '2026-02',
        type: 'allowance-deduction',
        description: 'Pay-level change as recorded in service order',
        salaryUpdates: { professionalTaxLevelBand: 'level-15-and-above' }
      }]
    });
    const restored = parseArrearsScenarioBackup(serializeArrearsScenario(scenario));
    expect(restored.baseSalary.professionalTaxLevelBand).toBe('below-level-15');
    expect(restored.changes[0].salaryUpdates?.professionalTaxLevelBand).toBe('level-15-and-above');
  });

  it('rejects a backup with only one of historical schedule or selected components', () => {
    const scenario = createArrearsScenario({
      ...input(),
      historicalRateComponents: ['daRate']
    });
    expect(validateArrearsScenario(scenario)).toBe(false);
    expect(() => serializeArrearsScenario(scenario)).toThrow(/invalid/);
  });

  it('creates a consecutive monthly CSV template and imports payslip data', () => {
    const months = getArrearsMonthKeys('2026-01', '2026-03');
    const template = createArrearsEntryTemplateCsv(months);
    expect(template).toContain('month,actualTakeHome,recovery');
    const csv = [
      'month,actualTakeHome,recovery',
      '2026-01,50000,0',
      '2026-02,49000,250',
      '2026-03,51000,100'
    ].join('\n');
    const imported = parseArrearsEntryCsv(csv, months);
    expect(imported).toEqual([
      { month: '2026-01', actualTakeHome: 50_000, recovery: 0 },
      { month: '2026-02', actualTakeHome: 49_000, recovery: 250 },
      { month: '2026-03', actualTakeHome: 51_000, recovery: 100 }
    ]);
  });

  it('rejects duplicate months, out-of-period months and negative amounts', () => {
    const months = getArrearsMonthKeys('2026-01', '2026-02');
    expect(() => parseArrearsEntryCsv(
      'month,actualTakeHome,recovery\n2026-01,50000,0\n2026-01,50000,0',
      months
    )).toThrow(/duplicate month/);
    expect(() => parseArrearsEntryCsv(
      'month,actualTakeHome,recovery\n2026-03,50000,0',
      months
    )).toThrow(/outside the selected/);
    expect(() => parseArrearsEntryCsv(
      'month,actualTakeHome,recovery\n2026-01,-1,0',
      months
    )).toThrow(/non-negative/);
  });

  it('handles quoted fields and rejects malformed CSV quoting', () => {
    const months = getArrearsMonthKeys('2026-01', '2026-01');
    expect(parseArrearsEntryCsv(
      'month,actualTakeHome,recovery\n"2026-01","50000","0"',
      months
    )[0].actualTakeHome).toBe(50_000);
    expect(() => parseArrearsEntryCsv(
      'month,actualTakeHome,recovery\n"2026-01,50000,0',
      months
    )).toThrow(/unclosed quoted/);
  });
});
