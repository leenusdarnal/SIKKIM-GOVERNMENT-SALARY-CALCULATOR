import { describe, expect, it } from 'vitest';
import { calculateTemporaryPay, getTemporaryPay, TEMPORARY_PAY_OPTIONS } from './temporary-pay';

const confirmed = { sourceVerified: true, salaryMonth: '2026-09' };

describe('Sikkim temporary and training pay references', () => {
  it('retains all five Group C/D equivalent-grade-pay monthly amounts', () => {
    expect(TEMPORARY_PAY_OPTIONS.filter((item) => item.id.startsWith('gp-')).map((item) => item.amount))
      .toEqual([18_000, 15_000, 12_000, 10_500, 9_000]);
  });

  it('retains all 16 specific-post consolidated-pay rows', () => {
    expect(TEMPORARY_PAY_OPTIONS.filter((item) => item.category === 'specific-post')).toHaveLength(16);
    expect(getTemporaryPay('consultant-super-specialist')).toBe(250_000);
    expect(getTemporaryPay('associate-professor-sgmc')).toBe(220_000);
    expect(getTemporaryPay('assistant-architect-engineer')).toBe(25_000);
  });

  it('attaches the correct source and effective date to each schedule', () => {
    const consolidated = TEMPORARY_PAY_OPTIONS.find((item) => item.id === 'gp-3800')!;
    const training = TEMPORARY_PAY_OPTIONS.find((item) => item.id === 'training-group-b-outside')!;
    expect(consolidated.effectiveFrom).toBe('2026-08-12');
    expect(consolidated.sourceReference).toContain('M(164)/42/GEN/DOP');
    expect(training.effectiveFrom).toBe('2024-07-25');
    expect(training.sourceReference).toContain('J(1)/86-GEN/DOP');
    expect(TEMPORARY_PAY_OPTIONS.every((item) => item.sourceReference && item.sourceUrl.startsWith('https://'))).toBe(true);
  });

  it('blocks use before the selected notification becomes effective', () => {
    const result = calculateTemporaryPay({ ...confirmed, optionId: 'gp-3800', salaryMonth: '2026-08' });
    expect(result.valid).toBe(false);
    expect(result.amount).toBeNull();
    expect(result.errors).toContain('The selected notification rate is not effective for the selected salary month.');
  });

  it('blocks calculation until the user confirms source applicability', () => {
    const result = calculateTemporaryPay({ optionId: 'gp-3800', salaryMonth: '2026-09', sourceVerified: false });
    expect(result.valid).toBe(false);
    expect(result.amount).toBeNull();
  });

  it('accepts a source-confirmed full monthly consolidated rate', () => {
    const result = calculateTemporaryPay({ ...confirmed, optionId: 'gp-3800', daysInMonth: 30, payableDays: 30 });
    expect(result.valid).toBe(true);
    expect(result.amount).toBe(18_000);
    expect(result.basis).toBe('monthly');
  });

  it('rejects partial-month proration without an approved formula', () => {
    const result = calculateTemporaryPay({ ...confirmed, optionId: 'gp-3800', daysInMonth: 30, payableDays: 20 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('partial-month proration'))).toBe(true);
  });

  it('validates calendar attendance boundaries, zero days and actual month length', () => {
    const zero = calculateTemporaryPay({ ...confirmed, optionId: 'driver-daily-wage', payableDays: 0, dailyRate: 500, dailyRateSourceReference: 'Labour notification', dailyRateEffectiveFrom: '2026-01-01', dailyRateVerified: true, daysInMonth: 30 });
    expect(zero.valid).toBe(false);
    const over = calculateTemporaryPay({ ...confirmed, optionId: 'driver-daily-wage', payableDays: 31, dailyRate: 500, dailyRateSourceReference: 'Labour notification', dailyRateEffectiveFrom: '2026-01-01', dailyRateVerified: true, daysInMonth: 30 });
    expect(over.valid).toBe(false);
    const wrongMonthLength = calculateTemporaryPay({ ...confirmed, optionId: 'driver-daily-wage', payableDays: 30, dailyRate: 500, dailyRateSourceReference: 'Labour notification', dailyRateEffectiveFrom: '2026-01-01', dailyRateVerified: true, daysInMonth: 30, salaryMonth: '2026-10' });
    expect(wrongMonthLength.valid).toBe(false);
  });

  it('requires the Labour Department rate, its source, effective date and applicability confirmation', () => {
    const missing = calculateTemporaryPay({ ...confirmed, optionId: 'driver-daily-wage' });
    expect(missing.valid).toBe(false);
    expect(missing.amount).toBeNull();
    const good = calculateTemporaryPay({ ...confirmed, optionId: 'driver-daily-wage', payableDays: 24, dailyRate: 500, dailyRateSourceReference: 'Labour Dept. Notification LD/12/2026', dailyRateEffectiveFrom: '2026-01-01', dailyRateVerified: true, daysInMonth: 30 });
    expect(good.valid).toBe(true);
    expect(good.amount).toBe(12_000);
  });

  it('rejects malformed dates, future daily rates, invalid days and invalid rates', () => {
    expect(calculateTemporaryPay({ ...confirmed, optionId: 'gp-3800', salaryMonth: '2026-13' }).valid).toBe(false);
    expect(calculateTemporaryPay({ ...confirmed, optionId: 'driver-daily-wage', payableDays: 24, dailyRate: -1, dailyRateSourceReference: 'LD order', dailyRateEffectiveFrom: '2026-10-01', dailyRateVerified: true, daysInMonth: 30 }).valid).toBe(false);
    expect(calculateTemporaryPay({ ...confirmed, optionId: 'driver-daily-wage', payableDays: 24, dailyRate: 500, dailyRateSourceReference: 'LD order', dailyRateEffectiveFrom: '2026-12-01', dailyRateVerified: true, daysInMonth: 30 }).valid).toBe(false);
  });

  it('rounds daily-wage multiplication to the nearest rupee', () => {
    const result = calculateTemporaryPay({ ...confirmed, optionId: 'driver-daily-wage', payableDays: 3, dailyRate: 500.5, dailyRateSourceReference: 'LD order', dailyRateEffectiveFrom: '2026-01-01', dailyRateVerified: true, daysInMonth: 30 });
    expect(result.amount).toBe(1502);
  });

  it('does not invent a monthly amount for temporary drivers or unknown options', () => {
    expect(getTemporaryPay('driver-daily-wage')).toBeNull();
    expect(getTemporaryPay('unknown-post')).toBeNull();
  });
});
