# Salary arrears planner — calculation and scope audit

Review date: 9 November 2026

## Purpose and status

The arrears planner is an employee-side estimate and reconciliation aid. It reconstructs a revised monthly salary basis from user-entered opening figures and signed-order/pay-slip changes, compares the result with the net salary actually credited, subtracts separately recorded arrears recoveries, and produces a month-by-month statement.

It is not an official payroll, pay-fixation, leave-sanction, tax-computation or arrears-sanction system. No personal salary records are sent to a backend; drafts are stored in the user's browser only.

## Calculation model

1. Select up to 60 consecutive calendar months.
2. Enter the opening revised-pay basis for the first month: basic pay, DA, HRA eligibility/rate/minimum, SBCA, transport and other earnings; pension scheme/rates; Professional Tax mode/amount; Income Tax TDS; GIS, stamp fee and other deductions.
3. Add dated changes supported by the employee's actual order, eligibility record or payslip. Basic-pay events cover increment, promotion, financial upgradation or pay fixation. Allowance/deduction events can change HRA, SBCA, CPS rates, transport, other earnings, GPF/manual pension, Professional Tax, Income Tax TDS, GIS, stamp fee and other deductions.
4. Changes carry forward from their payable month until superseded. A later `payableFromMonth` can represent a notional effective month followed by an actual payable month (for example, where a study-leave increment is payable only after joining, as stated in the applicable order). The calculator does not infer employee eligibility.
5. Enter actual monthly net pay credited, additional arrears recoveries, payable days and (only where supported by the order/DDO calculation) a manual pay/leave factor.
6. For each month, the existing `calculateSalary` engine calculates itemized monthly earnings and deductions; the net comparison is:

   `Revised calculated take-home - Actual net credited - Additional recovery from arrears`

7. Optional simple interest is disabled at zero. When explicitly entered, it is calculated on positive monthly net differences from month-end to the settlement date using a 365-day denominator. It is displayed separately from the underlying arrears estimate.

A final net total and CSV statement are withheld until actual net credited pay has been entered for every month. Negative monthly and overall balances are shown rather than silently clamped to zero.

## Payable days and leave/pay factor

- Full calendar-month pay is used when payable days are blank. Where entered, the salary basis is prorated by `payableDays / calendarDays`.
- A separately entered `salaryFactorPercent` (0–100) further scales the pay base. This is a manual approximation factor, not a leave entitlement or statutory leave-salary formula.
- Basic Pay, DA, HRA, SBCA, transport and other earnings follow the prorated pay base. Percentage-based CPS/CPF is calculated on the prorated Basic Pay + DA.
- Manual GPF/pension, manual Professional Tax, Income Tax TDS, GIS, stamp fee and other fixed deductions remain at their entered monthly amounts unless a later effective-dated change is provided. Automatic Professional Tax is recalculated against the prorated gross under the salary engine's indicative slab.
- The DDO's approved leave-salary calculation may not be equivalent to simple daily proration or a single pay factor. For full-pay, half-pay, commuted leave, Child Care Leave, maternity leave, Study Leave, EOL and other categories, use the applicable rule, leave sanction and pay bill. Do not rely on the factor unless the DDO confirms it is a reasonable representation for the case.
- The planner does not calculate leave balances, admissibility, service eligibility or the legally payable leave salary.

## Pension, tax and interest

- CPS/CPF employee rate and State matching rate are separately configurable. Both default to 10% as the project reference; verify the applicable appointment coverage, scheme and order. The State matching contribution is reported separately and is not deducted from employee take-home.
- GPF and other manual pension amounts are entered from the employee's subscription/payslip record; the planner does not infer membership or apply an annual minimum/maximum subscription test here.
- Professional Tax supports the existing salary engine's indicative automatic estimate, manual payslip amount or none/exempt. Confirm the statutory base and employee exemption with the Accounts/DDO section.
- Income Tax TDS is a separate manually entered monthly deduction. There is no annual income-tax liability engine, tax regime selection, rebate/deduction/relief computation, or year-end TDS reconciliation.
- Interest is a user-supplied simple-interest estimate only. It does not establish a right to interest, choose a legally applicable rate, compound interest, or calculate interest on a negative balance. Enter a rate only where an order, court decision or competent authority authorises it.

## Effective-dated order handling

- Each change must have a month within the selected period, a non-empty order/payslip reference and valid amounts/rates.
- If `payableFromMonth` is omitted, the change is payable from its effective month. A later payable month preserves the notional date for display and begins salary recalculation from the later month.
- Multiple changes for the same payable month are applied in the order they were entered.
- Increment, promotion, ACPS, regularisation and fixation pay levels must be entered from the employee's actual signed fixation order. The tool does not decide eligibility, qualifying service, EOL impact, ACP entitlement, pay-cell conversion or arrears entitlement.
- Revised-pay DA is restricted to the revised-pay basis used by the salary engine. The 262% pre-revised DA scale is not a substitute rate to apply to revised basic pay; pre-revised pay conversion and DA-on-pre-revised-pay calculations are outside this tool.

## Drafts, import and export

- A versioned JSON scenario can be saved and restored in browser-local storage; JSON backup/restore is available for moving between devices.
- Monthly actual credited amounts, recoveries, payable days and factor percentages can be imported using the generated CSV template.
- The detailed arrears statement exports to CSV with monthly line items, order references, recoveries and optional interest.
- Browser-local data is not encrypted and is not transmitted to a server. Do not use shared devices or expose backup files containing salary information.

## Important exclusions

- Historical tax computation and year-end income-tax reconciliation.
- Automatic pre-revised pay conversion, DA on pre-revised pay, revised-pay fixation or matrix-cell derivation.
- Automated pay-fixation rules for direct recruits, promotions, ACPS/MACP, regularisation, EOL, study leave, CCL, maternity leave or other leave categories.
- Legal entitlement or sanction of HRA/SBCA, travel/transport, special allowances, pension contributions, recoveries, interest or arrears.
- Partial-month rules more complex than the manual payable-days/pay-factor approximation; leave-specific salary formulas.
- Automatic interest eligibility, compound interest, tax gross-up or retrospective recalculation of historical payroll-system-specific rounding.
- Employee details, service book records, appointment data, leave balances, annual taxable income, deductions/rebates and actual payslip data are not sourced automatically.

## Official references

- Sikkim Government Services (Revised Pay) Rules, 2018: https://www.sikkim.gov.in/uploads/Gazette/333_20240813.pdf
- Finance Department DA circular dated 1 October 2026: https://www.sikkimfred.gov.in/DA%20Enhancement/Documents/DA%20Circular%202026.pdf
- DOP clarification No. 6780/GEN/DOP on EOL and annual-increment dates: https://dop.sikkim.gov.in/circular/6780.pdf
- DOP OM No. 2255/GEN/DOP dated 20 March 2025 — Study Leave allowance and notional annual increment payable after joining: https://dop.sikkim.gov.in/circular/2255.pdf
- Sikkim Government Service (Leave) (Amendment) Rules, 2025 — Child Care Leave and leave salary: https://dop.sikkim.gov.in/notificationdoc/44.pdf
- Sikkim Government Service (Leave) Amendment Rules, 2026 and CCL cross-year clarification dated 16 July 2026: https://dop.sikkim.gov.in/notificationdoc/35.pdf

These official references help users verify the order applicable to their own case. They are not used to auto-derive employee-specific entitlements.
