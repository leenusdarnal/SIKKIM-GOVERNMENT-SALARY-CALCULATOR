export type PensionMode = 'unselected' | 'cps' | 'gpf' | 'manual' | 'none';
export type ProfessionalTaxMode = 'unselected' | 'auto' | 'manual' | 'none';
export type ProfessionalTaxLevelBand = 'unselected' | 'below-level-15' | 'level-15-and-above';

export interface SalaryInput {
  basicPay: number;
  daRate: number;
  hraEligible: boolean;
  hraRate: number;
  hraMinimum: number;
  sbcaRate: number;
  transportAllowance: number;
  otherEarnings: number;
  pensionMode: PensionMode;
  /** True only after checking individual CPS membership and the applicable contribution basis. */
  cpsMembershipConfirmed?: boolean;
  /** True only after confirming the employee's GPF account and subscription authority. */
  gpfMembershipConfirmed?: boolean;
  /** Rule-defined GPF reference pay for the relevant subscription year, confirmed by Accounts/DDO. */
  gpfReferencePay?: number;
  manualPension: number;
  professionalTaxMode: ProfessionalTaxMode;
  professionalTaxLevelBand: ProfessionalTaxLevelBand;
  manualProfessionalTax: number;
  gis: number;
  stampFee: number;
  otherDeductions: number;
}

export interface SalaryResult {
  basicPay: number;
  daRate: number;
  da: number;
  hra: number;
  sbca: number;
  transportAllowance: number;
  otherEarnings: number;
  gross: number;
  pensionMode: PensionMode;
  pensionLabel: string;
  employeePension: number;
  employerCpsContribution: number;
  professionalTax: number;
  professionalTaxBand: string;
  gis: number;
  stampFee: number;
  otherDeductions: number;
  totalDeductions: number;
  takeHome: number;
}

export const roundRupee = (amount: number): number =>
  Math.floor((Number.isFinite(amount) ? amount : 0) + 0.5);

export function validateGpfSubscription(
  referencePay: number | undefined,
  monthlyAmount: number,
  membershipConfirmed: boolean | undefined
): string[] {
  const errors: string[] = [];
  if (membershipConfirmed !== true) errors.push('Confirm the employee GPF account / membership and subscription authority with the service record and DDO / Accounts.');
  if (typeof referencePay !== 'number' || !Number.isFinite(referencePay) || referencePay <= 0) {
    errors.push('Enter the GPF reference pay applicable to the subscription year, as confirmed by Accounts / DDO.');
    return errors;
  }
  if (!Number.isFinite(monthlyAmount) || monthlyAmount < 0) {
    errors.push('Enter a valid non-negative monthly GPF subscription.');
    return errors;
  }
  const minimum = roundRupee(referencePay * 0.06);
  const maximum = roundRupee(referencePay);
  if (monthlyAmount < minimum || monthlyAmount > maximum) {
    errors.push('Monthly GPF subscription must be within the rule-based range of ' + minimum + ' to ' + maximum + ' INR (6%–100% of the entered reference pay).');
  }
  return errors;
}

const safeAmount = (amount: number): number =>
  Number.isFinite(amount) && amount > 0 ? amount : 0;

export function getSikkimProfessionalTax(levelBand: ProfessionalTaxLevelBand): { amount: number; band: string } {
  if (levelBand === 'below-level-15') return { amount: 150, band: 'Below Level 15 — ₹150' };
  if (levelBand === 'level-15-and-above') return { amount: 200, band: 'Level 15 and above — ₹200' };
  return { amount: 0, band: 'Pay-level band not selected — amount not calculated' };
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const basicPay = safeAmount(input.basicPay);
  const daRate = Math.min(200, safeAmount(input.daRate));
  const da = roundRupee((basicPay * daRate) / 100);
  const hraRate = Math.min(100, safeAmount(input.hraRate));
  const sbcaRate = Math.min(100, safeAmount(input.sbcaRate));
  const hra = input.hraEligible
    ? Math.max(safeAmount(input.hraMinimum), roundRupee((basicPay * hraRate) / 100))
    : 0;
  const sbca = roundRupee((basicPay * sbcaRate) / 100);
  const transportAllowance = roundRupee(safeAmount(input.transportAllowance));
  const otherEarnings = roundRupee(safeAmount(input.otherEarnings));
  const gross = basicPay + da + hra + sbca + transportAllowance + otherEarnings;

  let employeePension = 0;
  let employerCpsContribution = 0;
  let pensionLabel = 'Pension scheme not selected — amount not calculated';

  switch (input.pensionMode) {
    case 'unselected':
      break;
    case 'cps':
      if (input.cpsMembershipConfirmed === true) {
        employeePension = roundRupee(((basicPay + da) * 10) / 100);
        employerCpsContribution = employeePension;
        pensionLabel = 'Sikkim CPS employee contribution (10% of Basic + DA; verify current applicability)';
      } else {
        pensionLabel = 'CPS not calculated — confirm individual membership and contribution basis';
      }
      break;
    case 'gpf': {
      const gpfErrors = validateGpfSubscription(input.gpfReferencePay, input.manualPension, input.gpfMembershipConfirmed);
      if (!gpfErrors.length) {
        employeePension = roundRupee(safeAmount(input.manualPension));
        pensionLabel = 'GPF subscription (confirmed account; manual monthly amount)';
      } else {
        pensionLabel = 'GPF not calculated — ' + gpfErrors[0];
      }
      break;
    }
    case 'manual':
      employeePension = roundRupee(safeAmount(input.manualPension));
      pensionLabel = 'Other pension contribution (manual amount)';
      break;
  }

  const automaticTax = getSikkimProfessionalTax(input.professionalTaxLevelBand);
  const professionalTax =
    input.professionalTaxMode === 'none' || input.professionalTaxMode === 'unselected'
      ? 0
      : input.professionalTaxMode === 'manual'
        ? roundRupee(safeAmount(input.manualProfessionalTax))
        : automaticTax.amount;

  const gis = roundRupee(safeAmount(input.gis));
  const stampFee = roundRupee(safeAmount(input.stampFee));
  const otherDeductions = roundRupee(safeAmount(input.otherDeductions));
  const totalDeductions =
    employeePension + professionalTax + gis + stampFee + otherDeductions;

  return {
    basicPay, daRate, da, hra, sbca, transportAllowance, otherEarnings, gross,
    pensionMode: input.pensionMode, pensionLabel, employeePension,
    employerCpsContribution, professionalTax,
    professionalTaxBand:
      input.professionalTaxMode === 'unselected'
        ? 'Not selected — amount not calculated'
        : input.professionalTaxMode === 'auto'
        ? automaticTax.band
        : input.professionalTaxMode === 'manual'
          ? 'Manual override'
          : 'Not applicable',
    gis, stampFee, otherDeductions, totalDeductions,
    takeHome: gross - totalDeductions
  };
}


/**
 * Validates the complete regular monthly salary input before presenting a result.
 * The calculation engine remains deterministic and forgiving for display use,
 * but user-facing workflows should call this guard before treating an amount as valid.
 */
export function validateSalaryInput(input: SalaryInput): string[] {
  const errors: string[] = [];
  const numericFields = [
    'basicPay', 'daRate', 'hraRate', 'hraMinimum', 'sbcaRate',
    'transportAllowance', 'otherEarnings', 'manualPension',
    'manualProfessionalTax', 'gis', 'stampFee', 'otherDeductions'
  ] as const;

  for (const field of numericFields) {
    const value = input[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      errors.push(field + ' must be a finite, non-negative number.');
    } else if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      errors.push(field + ' exceeds the supported calculation range.');
    }
  }

  if (input.gpfReferencePay !== undefined &&
      (typeof input.gpfReferencePay !== 'number' || !Number.isFinite(input.gpfReferencePay) ||
       input.gpfReferencePay < 0 || input.gpfReferencePay > Number.MAX_SAFE_INTEGER)) {
    errors.push('GPF reference pay must be a finite, non-negative amount within the supported range.');
  }
  if (!(input.basicPay > 0)) errors.push('Enter a basic pay greater than zero.');
  if (input.daRate > 200) errors.push('DA rate must be between 0% and 200%.');
  if (input.hraRate > 100 || input.sbcaRate > 100) errors.push('HRA and SBCA rates must be between 0% and 100%.');
  if (typeof input.hraEligible !== 'boolean') errors.push('Select whether the employee is eligible for HRA.');
  if (!['cps', 'gpf', 'manual', 'none'].includes(input.pensionMode)) {
    errors.push('Select the applicable pension arrangement before calculating.');
  }
  if (input.cpsMembershipConfirmed !== undefined && typeof input.cpsMembershipConfirmed !== 'boolean') {
    errors.push('CPS membership confirmation must be a boolean selection.');
  }
  if (input.pensionMode === 'cps' && input.cpsMembershipConfirmed !== true) {
    errors.push('Confirm the employee CPS membership and applicable contribution basis from the service record / DDO before calculating.');
  }
  if (input.gpfMembershipConfirmed !== undefined && typeof input.gpfMembershipConfirmed !== 'boolean') {
    errors.push('GPF membership confirmation must be a boolean selection.');
  }
  if (input.pensionMode === 'gpf') {
    errors.push(...validateGpfSubscription(input.gpfReferencePay, input.manualPension, input.gpfMembershipConfirmed));
  }
  if (!['auto', 'manual', 'none'].includes(input.professionalTaxMode)) {
    errors.push('Select a Professional Tax treatment before calculating.');
  }
  if (!['unselected', 'below-level-15', 'level-15-and-above'].includes(input.professionalTaxLevelBand)) {
    errors.push('Select a valid Sikkim Professional Tax pay-level band.');
  }
  if (input.professionalTaxMode === 'auto' &&
      !['below-level-15', 'level-15-and-above'].includes(input.professionalTaxLevelBand)) {
    errors.push('Select the employee pay-level band for Sikkim Professional Tax.');
  }

  const result = calculateSalary(input);
  const calculatedAmounts = [
    result.basicPay, result.da, result.hra, result.sbca, result.transportAllowance,
    result.otherEarnings, result.gross, result.employeePension, result.employerCpsContribution,
    result.professionalTax, result.gis, result.stampFee, result.otherDeductions,
    result.totalDeductions, result.takeHome
  ];
  if (calculatedAmounts.some((value) => !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) {
    errors.push('The entered figures produce an amount outside the supported calculation range.');
  }

  return [...new Set(errors)];
}

export const DEFAULT_SALARY_INPUT: SalaryInput = {
  basicPay: 0,
  daRate: 60,
  hraEligible: false,
  hraRate: 12,
  hraMinimum: 0,
  sbcaRate: 0,
  transportAllowance: 0,
  otherEarnings: 0,
  pensionMode: 'unselected',
  cpsMembershipConfirmed: false,
  gpfMembershipConfirmed: false,
  gpfReferencePay: 0,
  manualPension: 0,
  professionalTaxMode: 'unselected',
  professionalTaxLevelBand: 'unselected',
  manualProfessionalTax: 0,
  gis: 0,
  stampFee: 0,
  otherDeductions: 0
};
