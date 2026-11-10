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
      employeePension = roundRupee(((basicPay + da) * 10) / 100);
      employerCpsContribution = employeePension;
      pensionLabel = 'Sikkim CPS employee contribution (10% of Basic + DA)';
      break;
    case 'gpf':
      employeePension = roundRupee(safeAmount(input.manualPension));
      pensionLabel = 'GPF contribution (manual amount)';
      break;
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
  manualPension: 0,
  professionalTaxMode: 'unselected',
  professionalTaxLevelBand: 'unselected',
  manualProfessionalTax: 0,
  gis: 0,
  stampFee: 0,
  otherDeductions: 0
};
