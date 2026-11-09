# Salary arrears planner — calculation and scope audit

Review date: 9 November 2026

## Purpose

The arrears planner creates a month-by-month estimate of revised net salary, compares it with actual net salary credited, and subtracts additional recoveries that are to be adjusted against the arrears settlement.

It is an independent estimate utility, not a payroll, pay-fixation or sanctioning system.

## Calculation model

1. The user selects a monthly period of up to 60 consecutive months.
2. The opening salary basis is entered for the first month: basic pay, DA rate, HRA eligibility/rate/minimum, SBCA rate, transport and other earnings, pension mode and deductions.
3. Effective-dated changes can update DA rate and/or basic pay from a selected month forward. Annual increment, promotion and pay-fixation events require the user to enter the new basic pay fixed by the competent authority.
4. For each month, the application calls the existing `calculateSalary` engine with the resulting basic pay and DA rate.
5. The user enters actual net salary credited for each month from the payslip/bank record, plus any additional recovery to be adjusted from the arrears settlement.
6. Monthly net difference is:

   `Revised calculated take-home - Actual net credited - Additional recovery from arrears`

A final net total and CSV statement are withheld until actual credited pay has been entered for every month. Negative monthly/overall balances are retained and displayed as possible overpayment or recoverable balance; they are not silently clamped to zero.

## Change rules

- Changes take effect for the whole effective month and every later month in the selected period.
- If multiple changes share a month, they are applied in the order entered.
- DA rates and new basic pay must be supported by the applicable signed Government order / pay-fixation statement.
- The tool does not determine increment eligibility, qualifying service, EOL impact, promotion fixation, ACPS entitlement or regularisation eligibility.
- The Department of Personnel's clarification No. 6780/GEN/DOP discusses the effect of EOL on annual-increment dates; employees must confirm the date applicable to their own service record.

## Important assumptions and exclusions

- The opening salary components remain constant until a dated basic-pay or DA change is entered.
- HRA, SBCA, transport, other earnings, manual pension/GPF, manual Professional Tax, GIS, stamp fee and other deductions use the opening values for every month in this version. They are not independently versioned by date.
- CPS/CPF is recalculated by the existing salary engine as 10% of Basic Pay + DA. Professional Tax automatic mode uses the existing calculator's indicative slabs; select manual mode and use payslip amounts where appropriate.
- Actual pay is compared at the net credited level. The planner does not independently reconstruct old gross salary or historical deduction schedules.
- No interest on arrears, tax recomputation, DA on pre-revised pay, leave salary, partial-month proration, rounding variations between DDO systems or pension revision is calculated.
- An additional recovery must not duplicate a deduction already included in the actual net credited salary.

## Source references

- Finance Department DA circular dated 1 October 2026: https://www.sikkimfred.gov.in/DA%20Enhancement/Documents/DA%20Circular%202026.pdf
- Department of Personnel clarification No. 6780/GEN/DOP on EOL and annual-increment dates: https://dop.sikkim.gov.in/circular/6780.pdf
- Sikkim Government Services (Revised Pay) Rules, 2018: https://www.sikkim.gov.in/uploads/Gazette/333_20240813.pdf

These sources are references for user verification. The application does not hardcode a complete historical DA rate table or assume that an order applies to every employee category.
