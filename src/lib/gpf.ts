export interface GpfEstimate {
  referencePay: number;
  contributionRate: number;
  monthlyContribution: number;
  annualContribution: number;
  minimumMonthlyContribution: number;
  maximumMonthlyContribution: number;
  valid: boolean;
  message: string;
}

/**
 * Sikkim GPF rule-based illustration.
 * The user must enter the pay amount applicable for the relevant GPF subscription
 * year from the service/pay records. This module does not decide GPF membership.
 */
export function calculateGpfContribution(referencePay: number, contributionRate: number): GpfEstimate {
  // Keep the annual estimate within JavaScript's safe whole-rupee range.
  const maximumReferencePay = Math.floor(Number.MAX_SAFE_INTEGER / 12);
  const pay = Number.isFinite(referencePay) && referencePay > 0 && referencePay <= maximumReferencePay
    ? referencePay : 0;
  const rate = Number.isFinite(contributionRate) ? contributionRate : 0;
  const minimumMonthlyContribution = Math.round(pay * 0.06);
  const maximumMonthlyContribution = Math.round(pay);
  const rateValid = rate >= 6 && rate <= 100;
  const provisionalMonthly = pay > 0 && rateValid ? Math.round(pay * rate / 100) : 0;
  const annual = provisionalMonthly * 12;
  const safe = [minimumMonthlyContribution, maximumMonthlyContribution, provisionalMonthly, annual]
    .every((value) => Number.isSafeInteger(value));
  const valid = pay > 0 && rateValid && safe;

  return {
    referencePay: pay,
    contributionRate: rate,
    monthlyContribution: valid ? provisionalMonthly : 0,
    annualContribution: valid ? annual : 0,
    minimumMonthlyContribution,
    maximumMonthlyContribution,
    valid,
    message: pay <= 0
      ? 'Enter a positive reference pay within the supported annual calculation range.'
      : !rateValid
        ? 'The contribution percentage must be between 6% and 100% under the referenced GPF rule.'
        : !safe
          ? 'The entered reference pay produces an amount outside the supported calculation range.'
          : 'Illustrative amount only. Confirm subscription eligibility, reference emoluments and any permitted change with the Accounts/DDO section.'
  };
}
