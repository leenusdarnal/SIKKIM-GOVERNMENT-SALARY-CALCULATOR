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
const amount=(n:number)=>Number.isFinite(n)&&n>0?n:0;
const rupee=(n:number)=>Math.round(n);
const percentValid=(n:number)=>Number.isFinite(n)&&n>=0&&n<=100;
/**
 * Generic retirement illustration. All rule-dependent bases, rates, factors,
 * divisors and ceilings are entered by the user from an applicable signed order
 * or Accounts/DDO confirmation. This module intentionally has no default rates.
 */
export function calculateRetirementEstimate(input:RetirementEstimateInput):RetirementEstimateResult {
  const errors:string[]=[];
  const fields: (keyof RetirementEstimateInput)[] = [
    'pensionableEmoluments','pensionRatePercent','commutationPercent','commutationMultiplierMonths',
    'gratuityEmoluments','gratuityServiceUnits','gratuityMultiplier','gratuityDivisor','gratuityCeiling',
    'leaveSalaryMonthly','eligibleLeaveDays','leaveEncashmentDivisor','otherRetirementBenefits'
  ];
  for(const field of fields) if(!Number.isFinite(input[field]) || input[field]<0) errors.push(field+' must be a non-negative number.');
  if(!percentValid(input.pensionRatePercent)) errors.push('Pension percentage must be between 0 and 100.');
  if(!percentValid(input.commutationPercent)) errors.push('Commutation percentage must be between 0 and 100.');
  if(input.commutationPercent>0 && input.commutationMultiplierMonths<=0) errors.push('Enter the commutation multiplier confirmed by the applicable authority.');
  const gratuityConfigured=[input.gratuityEmoluments,input.gratuityServiceUnits,input.gratuityMultiplier,input.gratuityCeiling].some(v=>v>0);
  if(gratuityConfigured && input.gratuityDivisor<=0) errors.push('Enter the gratuity divisor from the applicable rule/order.');
  const leaveConfigured=input.leaveSalaryMonthly>0 || input.eligibleLeaveDays>0;
  if(leaveConfigured && input.leaveEncashmentDivisor<=0) errors.push('Enter the leave-encashment divisor confirmed by Accounts.');
  const monthlyPension=rupee(amount(input.pensionableEmoluments)*amount(input.pensionRatePercent)/100);
  const commutedMonthlyPension=rupee(monthlyPension*amount(input.commutationPercent)/100);
  const residualMonthlyPension=monthlyPension-commutedMonthlyPension;
  const commutationLumpSum=rupee(commutedMonthlyPension*amount(input.commutationMultiplierMonths));
  const gratuityBeforeCeiling=input.gratuityDivisor>0
    ? rupee(amount(input.gratuityEmoluments)*amount(input.gratuityServiceUnits)*amount(input.gratuityMultiplier)/input.gratuityDivisor):0;
  const gratuity=gratuityConfigured?Math.min(gratuityBeforeCeiling,amount(input.gratuityCeiling)):0;
  const leaveEncashment=input.leaveEncashmentDivisor>0
    ? rupee(amount(input.leaveSalaryMonthly)*amount(input.eligibleLeaveDays)/input.leaveEncashmentDivisor):0;
  const otherRetirementBenefits=rupee(amount(input.otherRetirementBenefits));
  return {valid:errors.length===0,errors,monthlyPension,commutedMonthlyPension,residualMonthlyPension,commutationLumpSum,gratuityBeforeCeiling,gratuity,leaveEncashment,otherRetirementBenefits,totalOneTimeBenefits:commutationLumpSum+gratuity+leaveEncashment+otherRetirementBenefits};
}
export const DEFAULT_RETIREMENT_INPUT:RetirementEstimateInput={
 pensionableEmoluments:0,pensionRatePercent:0,commutationPercent:0,commutationMultiplierMonths:0,
 gratuityEmoluments:0,gratuityServiceUnits:0,gratuityMultiplier:0,gratuityDivisor:0,gratuityCeiling:0,
 leaveSalaryMonthly:0,eligibleLeaveDays:0,leaveEncashmentDivisor:0,otherRetirementBenefits:0
};
