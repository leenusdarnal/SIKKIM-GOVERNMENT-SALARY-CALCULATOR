import { calculateSalary, type SalaryInput, type SalaryResult } from './salary';

export interface PayslipEmployee {
  name: string;
  employeeId: string;
  designation: string;
  department: string;
  office: string;
  district: string;
  payLevel: string;
  cell: string;
}
export interface PayslipMonthRecord {
  month: string;
  gross: number;
  deductions: number;
  net: number;
}
export interface PayslipModel {
  valid: boolean;
  errors: string[];
  month: string;
  employee: PayslipEmployee;
  salaryInput: SalaryInput;
  salary: SalaryResult;
  annual: { year: number; monthsRecorded: number; gross: number; deductions: number; net: number };
  previousMonth: PayslipMonthRecord | null;
  monthComparison: { gross: number | null; deductions: number | null; net: number | null };
}
const blankEmployee: PayslipEmployee = { name:'', employeeId:'', designation:'', department:'', office:'', district:'', payLevel:'', cell:'' };
export function buildPayslipModel(month: string, employee: PayslipEmployee, salaryInput: SalaryInput, history: PayslipMonthRecord[] = []): PayslipModel {
  const errors: string[] = [];
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) errors.push('Select a valid salary month.');
  for (const [index, record] of history.entries()) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(record.month)) errors.push('History row '+(index+1)+' has an invalid month.');
    if (![record.gross,record.deductions,record.net].every(v=>Number.isFinite(v)&&v>=0)) errors.push('History row '+(index+1)+' contains an invalid amount.');
  }
  const unique = new Set(history.map(r=>r.month));
  if (unique.size !== history.length) errors.push('Annual history contains duplicate months.');
  if (salaryInput.professionalTaxMode === 'auto' && !['below-level-15','level-15-and-above'].includes(salaryInput.professionalTaxLevelBand)) errors.push('Select the employee pay-level band for Sikkim Professional Tax.');
  const salary = calculateSalary(salaryInput);
  const year = Number(month.slice(0,4));
  const yearRecords = history.filter(r=>r.month.startsWith(String(year)+'-') && r.month !== month).concat({
    month, gross:salary.gross, deductions:salary.totalDeductions, net:salary.takeHome
  }).sort((a,b)=>a.month.localeCompare(b.month));
  const previousMonth = history.filter(r=>r.month < month).sort((a,b)=>b.month.localeCompare(a.month))[0] ?? null;
  const current = { gross:salary.gross, deductions:salary.totalDeductions, net:salary.takeHome };
  return {
    valid: errors.length===0, errors, month, employee: { ...blankEmployee, ...employee },
    salaryInput: { ...salaryInput }, salary,
    annual: {
      year, monthsRecorded:yearRecords.length,
      gross:yearRecords.reduce((sum,r)=>sum+r.gross,0),
      deductions:yearRecords.reduce((sum,r)=>sum+r.deductions,0),
      net:yearRecords.reduce((sum,r)=>sum+r.net,0)
    },
    previousMonth,
    monthComparison: previousMonth ? {
      gross:current.gross-previousMonth.gross,
      deductions:current.deductions-previousMonth.deductions,
      net:current.net-previousMonth.net
    } : { gross:null,deductions:null,net:null }
  };
}
export function addOrReplacePayslipMonth(history: PayslipMonthRecord[], record: PayslipMonthRecord): PayslipMonthRecord[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(record.month) || ![record.gross,record.deductions,record.net].every(v=>Number.isFinite(v)&&v>=0)) {
    throw new Error('Enter a valid month and non-negative salary amounts.');
  }
  return [...history.filter(r=>r.month!==record.month),{...record}].sort((a,b)=>a.month.localeCompare(b.month));
}
export function createPayslipCsv(model: PayslipModel): string {
  if (!model.valid) throw new Error('Correct the payslip validation issues before exporting.');
  const rows: (string|number)[][] = [
    ['Sikkim Government employee monthly salary statement'],
    ['Month',model.month],['Employee',model.employee.name],['Employee ID',model.employee.employeeId],
    ['Designation',model.employee.designation],['Department',model.employee.department],['Office',model.employee.office],
    ['District',model.employee.district],['Pay level',model.employee.payLevel],['Cell / stage',model.employee.cell],
    ['Earnings component','Amount (INR)'],['Basic pay',model.salary.basicPay],['Dearness allowance',model.salary.da],
    ['House rent allowance',model.salary.hra],['SBCA',model.salary.sbca],['Transport allowance',model.salary.transportAllowance],
    ['Other earnings',model.salary.otherEarnings],['Gross salary',model.salary.gross],
    ['Deductions','Amount (INR)'],['Employee pension / GPF',model.salary.employeePension],
    ['Professional Tax',model.salary.professionalTax],['GIS',model.salary.gis],['Stamp / fixed fee',model.salary.stampFee],
    ['Other deductions',model.salary.otherDeductions],['Total deductions',model.salary.totalDeductions],
    ['Net take-home',model.salary.takeHome],['Employer CPS contribution (informational)',model.salary.employerCpsContribution],
    ['Annual gross to date',model.annual.gross],['Annual deductions to date',model.annual.deductions],['Annual net to date',model.annual.net]
  ];
  const cell=(v:string|number)=>'"'+String(v).replace(/"/g,'""')+'"';
  return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join(String.fromCharCode(13,10))+String.fromCharCode(13,10);
}
