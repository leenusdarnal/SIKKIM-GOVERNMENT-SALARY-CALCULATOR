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
  const pay = Number.isFinite(referencePay) && referencePay > 0 ? referencePay : 0;
  const rate = Number.isFinite(contributionRate) ? contributionRate : 0;
  const minimumMonthlyContribution = Math.round(pay * 0.06);
  const maximumMonthlyContribution = Math.round(pay);
  const valid = pay > 0 && rate >= 6 && rate <= 100;
  const monthlyContribution = valid ? Math.round(pay * rate / 100) : 0;
  return {
    referencePay: pay,
    contributionRate: rate,
    monthlyContribution,
    annualContribution: monthlyContribution * 12,
    minimumMonthlyContribution,
    maximumMonthlyContribution,
    valid,
    message: pay <= 0
      ? 'Enter the applicable reference pay from the employee record.'
      : rate < 6 || rate > 100
        ? 'The contribution percentage must be between 6% and 100% under the referenced GPF rule.'
        : 'Illustrative amount only. Confirm subscription eligibility, reference emoluments and any permitted change with the Accounts/DDO section.'
  };
}
