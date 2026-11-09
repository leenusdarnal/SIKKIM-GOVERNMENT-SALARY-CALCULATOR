import { describe, expect, it } from 'vitest';
import { DEFAULT_SALARY_INPUT } from './salary';
import { calculateArrears, getArrearsMonthKeys, type ArrearsInput } from './arrears';
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
    ],
    interestSettings: { annualRate: 0, settlementDate: '' }
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

  it('creates a consecutive monthly CSV template and imports editable payslip data', () => {
    const months = getArrearsMonthKeys('2026-01', '2026-03');
    const template = createArrearsEntryTemplateCsv(months);
    expect(template).toContain('month,actualTakeHome,recovery,payableDays,salaryFactorPercent');
    const csv = [
      'month,actualTakeHome,recovery,payableDays,salaryFactorPercent',
      '2026-01,50000,0,31,100',
      '2026-02,49000,250,28,50',
      '2026-03,51000,100,,100'
    ].join('\n');
    const imported = parseArrearsEntryCsv(csv, months);
    expect(imported).toEqual([
      { month: '2026-01', actualTakeHome: 50_000, recovery: 0, payableDays: 31, salaryFactorPercent: 100 },
      { month: '2026-02', actualTakeHome: 49_000, recovery: 250, payableDays: 28, salaryFactorPercent: 50 },
      { month: '2026-03', actualTakeHome: 51_000, recovery: 100, payableDays: null, salaryFactorPercent: 100 }
    ]);
  });

  it('rejects CSV rows with duplicate months, out-of-period months and negative numbers', () => {
    const months = getArrearsMonthKeys('2026-01', '2026-02');
    expect(() => parseArrearsEntryCsv(
      'month,actualTakeHome,recovery,payableDays,salaryFactorPercent\n2026-01,50000,0,,100\n2026-01,50000,0,,100',
      months
    )).toThrow(/duplicate month/);
    expect(() => parseArrearsEntryCsv(
      'month,actualTakeHome,recovery,payableDays,salaryFactorPercent\n2026-03,50000,0,,100',
      months
    )).toThrow(/outside the selected/);
    expect(() => parseArrearsEntryCsv(
      'month,actualTakeHome,recovery,payableDays,salaryFactorPercent\n2026-01,-1,0,,100',
      months
    )).toThrow(/non-negative/);
  });
});
