import {describe,expect,it} from 'vitest';
import {addOrReplacePayslipMonth,buildPayslipModel,createPayslipCsv} from './payslip';
import {calculateSalary,DEFAULT_SALARY_INPUT} from './salary';
const input={...DEFAULT_SALARY_INPUT,basicPay:50000,daRate:0,hraRate:0,professionalTaxMode:'none' as const,pensionMode:'none' as const};
const employee={name:'Test Employee',employeeId:'T-01',designation:'Assistant',department:'Test Dept',office:'HQ',district:'Gangtok',payLevel:'Level 10',cell:'Cell 1'};
describe('monthly payslip',()=>{
 it('builds current salary and annual summary using supplied month records',()=>{
  const m=buildPayslipModel('2026-11',employee,input,[{month:'2026-10',gross:49000,deductions:1000,net:48000}]);
  expect(m.valid).toBe(true);expect(m.salary.gross).toBe(50000);expect(m.annual.monthsRecorded).toBe(2);expect(m.annual.gross).toBe(99000);expect(m.monthComparison.net).toBe(2000);
 });
 it('compares against most recent earlier month, not an arbitrary row',()=>{
  const m=buildPayslipModel('2026-11',employee,input,[{month:'2026-09',gross:45000,deductions:1000,net:44000},{month:'2026-10',gross:49000,deductions:1000,net:48000}]);
  expect(m.previousMonth?.month).toBe('2026-10');
 });
 it('adds or replaces a month without losing other months',()=>{
  const h=addOrReplacePayslipMonth([{month:'2026-09',gross:1,deductions:0,net:1},{month:'2026-10',gross:2,deductions:0,net:2}],{month:'2026-10',gross:3,deductions:0,net:3});
  expect(h).toHaveLength(2);expect(h[1].gross).toBe(3);
 });
 it('rejects invalid months, duplicate history and invalid amounts',()=>{
  expect(buildPayslipModel('2026-13',employee,input).valid).toBe(false);
  expect(buildPayslipModel('2026-11',employee,input,[{month:'2026-10',gross:-1,deductions:0,net:0}]).valid).toBe(false);
  expect(buildPayslipModel('2026-11',employee,input,[{month:'2026-10',gross:1,deductions:0,net:1},{month:'2026-10',gross:1,deductions:0,net:1}]).valid).toBe(false);
 });
 it('blocks CPS payslip calculations until membership and contribution basis are confirmed',()=>{
  const unconfirmed=buildPayslipModel('2026-11',employee,{...input,pensionMode:'cps',cpsMembershipConfirmed:false});
  expect(unconfirmed.valid).toBe(false);
  expect(unconfirmed.errors.join(' ')).toContain('Confirm the employee CPS membership');
  const confirmedInput={...input,pensionMode:'cps' as const,cpsMembershipConfirmed:true};
  const confirmed=buildPayslipModel('2026-11',employee,confirmedInput);
  const salary=calculateSalary(confirmedInput);
  expect(confirmed.valid).toBe(true);
  expect(confirmed.salary.employeePension).toBe(salary.employeePension);
  expect(confirmed.salary.employerCpsContribution).toBe(salary.employeePension);
  expect(confirmed.salary.totalDeductions).toBe(confirmed.salary.employeePension);
  expect(confirmed.salary.takeHome).toBe(confirmed.salary.gross-confirmed.salary.employeePension);
 });
 it('blocks GPF payslips without account confirmation, reference pay or a valid subscription',()=>{
  const unconfirmed=buildPayslipModel('2026-11',employee,{...input,pensionMode:'gpf',manualPension:2000,gpfReferencePay:30000,gpfMembershipConfirmed:false});
  expect(unconfirmed.valid).toBe(false);expect(unconfirmed.errors.join(' ')).toContain('GPF account');
  const noReference=buildPayslipModel('2026-11',employee,{...input,pensionMode:'gpf',manualPension:2000,gpfMembershipConfirmed:true});
  expect(noReference.valid).toBe(false);expect(noReference.errors.join(' ')).toContain('reference pay');
  const belowMinimum=buildPayslipModel('2026-11',employee,{...input,pensionMode:'gpf',manualPension:1799,gpfReferencePay:30000,gpfMembershipConfirmed:true});
  expect(belowMinimum.valid).toBe(false);expect(belowMinimum.errors.join(' ')).toContain('6%–100%');
  const validInput={...input,pensionMode:'gpf' as const,manualPension:2000,gpfReferencePay:30000,gpfMembershipConfirmed:true};
  const valid=buildPayslipModel('2026-11',employee,validInput);
  expect(valid.valid).toBe(true);expect(valid.salary.employeePension).toBe(2000);expect(valid.salary.employerCpsContribution).toBe(0);
  expect(valid.salary.totalDeductions).toBe(2000);expect(valid.salary.takeHome).toBe(valid.salary.gross-2000);
 });
 it('requires a Sikkim pay-level band for automatic Professional Tax',()=>{
  const m=buildPayslipModel('2026-11',employee,{...input,professionalTaxMode:'auto',professionalTaxLevelBand:'unselected'});
  expect(m.valid).toBe(false);
  expect(m.errors.join(' ')).toContain('pay-level band');
 });
 it('excludes later months from the selected month annual-to-date totals',()=>{
  const m=buildPayslipModel('2026-06',employee,input,[{month:'2026-05',gross:100,deductions:10,net:90},{month:'2026-07',gross:700,deductions:70,net:630}]);
  expect(m.annual.monthsRecorded).toBe(2);
  expect(m.annual.gross).toBe(50100);
 });
 it('blocks invalid salary inputs rather than silently converting them to zero',()=>{
  expect(buildPayslipModel('2026-11',employee,{...input,basicPay:Number.NaN}).valid).toBe(false);
  expect(buildPayslipModel('2026-11',employee,{...input,daRate:-1}).valid).toBe(false);
  expect(buildPayslipModel('2026-11',employee,{...input,pensionMode:'unselected'}).valid).toBe(false);
  expect(buildPayslipModel('2026-11',employee,{...input,professionalTaxMode:'unselected'}).valid).toBe(false);
 });
 it('neutralizes spreadsheet formula prefixes in exported employee text fields',()=>{
  const m=buildPayslipModel('2026-11',{...employee,name:'=HYPERLINK("https://bad.example","click")'},input);
  const csv=createPayslipCsv(m);
  expect(csv).toContain("\"'=HYPERLINK(\"\"https://bad.example\"\",\"\"click\"\")\"");
 });
 it('exports a CSV statement with earnings, deductions and annual totals',()=>{
  const m=buildPayslipModel('2026-11',employee,input,[{month:'2026-10',gross:49000,deductions:1000,net:48000}]);
  const csv=createPayslipCsv(m);expect(csv).toContain('Net take-home');expect(csv).toContain('Annual gross to date');expect(csv).toContain('Test Employee');
 });
});
