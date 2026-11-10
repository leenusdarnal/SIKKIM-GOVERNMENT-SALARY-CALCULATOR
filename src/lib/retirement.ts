export interface RetirementEstimateInput {
  pensionableEmoluments: number;
  pensionRatePercent: number;
  commutationPercent: number;
  commutationMultiplierMonths: number;
  gratuityEmoluments: number;
  gratuityServiceUnits: number;
  gratuityMultiplier: number;
  gratuityDivisor: number;
  gratuityCeiling: number;
  leaveSalaryMonthly: number;
  eligibleLeaveDays: number;
  leaveEncashmentDivisor: number;
  otherRetirementBenefits: number;
}
export interface RetirementEstimateResult {
  valid: boolean;
  errors: string[];
  monthlyPension: number;
  commutedMonthlyPension: number;
  residualMonthlyPension: number;
  commutationLumpSum: number;
  gratuityBeforeCeiling: number;
  gratuity: number;
  leaveEncashment: number;
  otherRetirementBenefits: number;
  totalOneTimeBenefits: number;
}
const rupee = (n: number) => Math.round(n);
const percentValid = (n: number) => Number.isFinite(n) && n >= 0 && n <= 100;
const emptyResult = (errors: string[]): RetirementEstimateResult => ({
  valid: false, errors,
  monthlyPension: 0, commutedMonthlyPension: 0, residualMonthlyPension: 0,
  commutationLumpSum: 0, gratuityBeforeCeiling: 0, gratuity: 0,
  leaveEncashment: 0, otherRetirementBenefits: 0, totalOneTimeBenefits: 0
});

/**
 * Generic retirement illustration. All rule-dependent bases, rates, factors,
 * divisors and ceilings are entered by the user from an applicable signed order
 * or Accounts/DDO confirmation. This module intentionally has no default rates.
 *
 * A benefit section is either left entirely at zero (not estimated) or must be
 * fully configured. Invalid/incomplete inputs never return displayable amounts.
 */
export function calculateRetirementEstimate(input: RetirementEstimateInput): RetirementEstimateResult {
  const errors: string[] = [];
  const fields: (keyof RetirementEstimateInput)[] = [
    'pensionableEmoluments', 'pensionRatePercent', 'commutationPercent', 'commutationMultiplierMonths',
    'gratuityEmoluments', 'gratuityServiceUnits', 'gratuityMultiplier', 'gratuityDivisor', 'gratuityCeiling',
    'leaveSalaryMonthly', 'eligibleLeaveDays', 'leaveEncashmentDivisor', 'otherRetirementBenefits'
  ];

  for (const field of fields) {
    const value = input[field];
    if (!Number.isFinite(value) || value < 0) errors.push(field + ' must be a finite non-negative number.');
  }
  if (!percentValid(input.pensionRatePercent)) errors.push('Pension percentage must be between 0 and 100.');
  if (!percentValid(input.commutationPercent)) errors.push('Commutation percentage must be between 0 and 100.');

  const pensionConfigured = input.pensionableEmoluments > 0 || input.pensionRatePercent > 0;
  if (pensionConfigured && (input.pensionableEmoluments <= 0 || input.pensionRatePercent <= 0)) {
    errors.push('To estimate pension, enter both positive pensionable emoluments and a positive pension percentage.');
  }

  const commutationConfigured = input.commutationPercent > 0 || input.commutationMultiplierMonths > 0;
  if (commutationConfigured) {
    if (input.commutationPercent <= 0 || input.commutationMultiplierMonths <= 0) {
      errors.push('To estimate commutation, enter both a positive commutation percentage and the approved multiplier.');
    }
    if (!pensionConfigured || input.pensionableEmoluments <= 0 || input.pensionRatePercent <= 0) {
      errors.push('Commutation requires a valid, positive pension estimate.');
    }
  }

  const gratuityValues = [
    input.gratuityEmoluments, input.gratuityServiceUnits, input.gratuityMultiplier,
    input.gratuityDivisor, input.gratuityCeiling
  ];
  const gratuityConfigured = gratuityValues.some((value) => value > 0);
  if (gratuityConfigured && gratuityValues.some((value) => value <= 0)) {
    errors.push('To estimate gratuity, enter positive emoluments, eligible service units, multiplier, divisor and applicable ceiling.');
  }

  const leaveValues = [input.leaveSalaryMonthly, input.eligibleLeaveDays, input.leaveEncashmentDivisor];
  const leaveConfigured = leaveValues.some((value) => value > 0);
  if (leaveConfigured && leaveValues.some((value) => value <= 0)) {
    errors.push('To estimate leave encashment, enter a positive monthly leave-salary base, certified leave days and approved divisor.');
  }

  if (errors.length) return emptyResult(errors);

  const monthlyPension = pensionConfigured
    ? rupee(input.pensionableEmoluments * input.pensionRatePercent / 100) : 0;
  const commutedMonthlyPension = commutationConfigured
    ? rupee(monthlyPension * input.commutationPercent / 100) : 0;
  const residualMonthlyPension = monthlyPension - commutedMonthlyPension;
  const commutationLumpSum = commutationConfigured
    ? rupee(commutedMonthlyPension * input.commutationMultiplierMonths) : 0;
  const gratuityBeforeCeiling = gratuityConfigured
    ? rupee(input.gratuityEmoluments * input.gratuityServiceUnits * input.gratuityMultiplier / input.gratuityDivisor) : 0;
  const gratuity = gratuityConfigured ? Math.min(gratuityBeforeCeiling, input.gratuityCeiling) : 0;
  const leaveEncashment = leaveConfigured
    ? rupee(input.leaveSalaryMonthly * input.eligibleLeaveDays / input.leaveEncashmentDivisor) : 0;
  const otherRetirementBenefits = rupee(input.otherRetirementBenefits);
  const totalOneTimeBenefits = commutationLumpSum + gratuity + leaveEncashment + otherRetirementBenefits;

  const outputs = [
    monthlyPension, commutedMonthlyPension, residualMonthlyPension, commutationLumpSum,
    gratuityBeforeCeiling, gratuity, leaveEncashment, otherRetirementBenefits, totalOneTimeBenefits
  ];
  if (outputs.some((value) => !Number.isFinite(value) || !Number.isSafeInteger(value))) {
    return emptyResult(['The entered values produce an amount outside the supported whole-rupee calculation range. Check the figures and units.']);
  }

  return {
    valid: true, errors,
    monthlyPension, commutedMonthlyPension, residualMonthlyPension, commutationLumpSum,
    gratuityBeforeCeiling, gratuity, leaveEncashment, otherRetirementBenefits, totalOneTimeBenefits
  };
}

export const DEFAULT_RETIREMENT_INPUT: RetirementEstimateInput = {
  pensionableEmoluments: 0, pensionRatePercent: 0, commutationPercent: 0, commutationMultiplierMonths: 0,
  gratuityEmoluments: 0, gratuityServiceUnits: 0, gratuityMultiplier: 0, gratuityDivisor: 0, gratuityCeiling: 0,
  leaveSalaryMonthly: 0, eligibleLeaveDays: 0, leaveEncashmentDivisor: 0, otherRetirementBenefits: 0
};
