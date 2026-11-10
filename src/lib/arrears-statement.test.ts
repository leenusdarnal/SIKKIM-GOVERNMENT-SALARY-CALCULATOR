import {describe,expect,it} from 'vitest';
import {buildArrearsStatement,type ArrearsStatementMetadata} from './arrears-statement';
import type {ArrearsResult} from './arrears';
const metadata:ArrearsStatementMetadata={employeeName:'Test',employeeId:'',designation:'',department:'',office:'',district:'',payLevel:'',cell:''};
const result:ArrearsResult={valid:true,complete:true,errors:[],rows:[{month:'2026-01',basicPay:30000,daRate:0,da:0,hra:0,sbca:0,transportAllowance:0,otherEarnings:0,grossEntitlement:30000,employeePension:0,employerCpsContribution:0,professionalTax:150,gis:10,stampFee:0,otherDeductions:0,employeeDeductions:160,revisedTakeHome:29840,actualTakeHome:29000,recovery:100,netArrears:740,appliedChanges:['Order 1']}],totals:{grossEntitlement:30000,employeeDeductions:160,employerCpsContribution:0,revisedTakeHome:29840,actualTakeHome:29000,recoveries:100,positiveArrears:840,negativeBalance:0,netArrears:740}};
describe('buildArrearsStatement',()=>{
 it('uses existing calculated rows and totals',()=>{const s=buildArrearsStatement(result,metadata);expect(s?.totals.netArrears).toBe(740);expect(s?.rows[0].revisedTakeHome).toBe(29840);expect(s?.appliedChanges).toEqual(['Order 1']);});
 it('blocks invalid or incomplete calculations',()=>{expect(buildArrearsStatement({...result,valid:false},metadata)).toBeNull();expect(buildArrearsStatement({...result,complete:false},metadata)).toBeNull();});
 it('guards against missing monthly actual or net amounts',()=>{expect(buildArrearsStatement({...result,rows:[{...result.rows[0],actualTakeHome:null}]},metadata)).toBeNull();expect(buildArrearsStatement({...result,rows:[{...result.rows[0],netArrears:null}]},metadata)).toBeNull();});
 it('copies row arrays and metadata without mutating source',()=>{const s=buildArrearsStatement(result,metadata)!;s.rows[0].appliedChanges.push('local');expect(result.rows[0].appliedChanges).toEqual(['Order 1']);});
});
