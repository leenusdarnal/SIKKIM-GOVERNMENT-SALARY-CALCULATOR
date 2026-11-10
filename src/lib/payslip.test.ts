import {describe,expect,it} from 'vitest';
import {addOrReplacePayslipMonth,buildPayslipModel,createPayslipCsv} from './payslip';
import {DEFAULT_SALARY_INPUT} from './salary';
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
 it('requires a Sikkim pay-level band for automatic Professional Tax',()=>{
  const m=buildPayslipModel('2026-11',employee,{...input,professionalTaxMode:'auto',professionalTaxLevelBand:'unselected'});
  expect(m.valid).toBe(false);
  expect(m.errors.join(' ')).toContain('pay-level band');
 });
 it('exports a CSV statement with earnings, deductions and annual totals',()=>{
  const m=buildPayslipModel('2026-11',employee,input,[{month:'2026-10',gross:49000,deductions:1000,net:48000}]);
  const csv=createPayslipCsv(m);expect(csv).toContain('Net take-home');expect(csv).toContain('Annual gross to date');expect(csv).toContain('Test Employee');
 });
});
