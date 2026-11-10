import type { ArrearsResult, ArrearMonthRow, ArrearsTotals } from './arrears';
export interface ArrearsStatementMetadata { employeeName:string; employeeId:string; designation:string; department:string; office:string; district:string; payLevel:string; cell:string; }
export interface PrintableArrearsStatement { rows:ArrearMonthRow[]; totals:ArrearsTotals & {netArrears:number}; metadata:ArrearsStatementMetadata; appliedChanges:string[]; }
/** Build a print model only from a valid, complete arrears result; no salary formula is repeated here. */
export function buildArrearsStatement(result:ArrearsResult, metadata:ArrearsStatementMetadata):PrintableArrearsStatement|null {
 if(!result.valid || !result.complete || result.totals.netArrears===null || result.rows.length===0) return null;
 if(result.rows.some(row=>row.actualTakeHome===null || row.netArrears===null)) return null;
 return { rows:result.rows.map(row=>({...row,appliedChanges:[...row.appliedChanges]})), totals:{...result.totals,netArrears:result.totals.netArrears}, metadata:{...metadata}, appliedChanges:[...new Set(result.rows.flatMap(row=>row.appliedChanges))] };
}
