# Salary arrears planner — calculation and scope audit

Review date: 9 November 2026

## Purpose

The arrears planner creates a month-by-month estimate of revised net salary, compares it with actual net salary credited, and subtracts additional recoveries that are to be adjusted against the arrears settlement.

It is an independent estimate utility, not a payroll, pay-fixation or sanctioning system.

## Calculation model

1. The user selects a monthly period of up to 60 consecutive months.
2. The opening salary basis is entered for the first month: basic pay, DA rate, HRA eligibility/rate/minimum, SBCA rate, transport and other earnings, pension mode and deductions.
3. Effective-dated changes can update DA rate, basic pay, HRA eligibility/rate/minimum, SBCA rate, transport and other earnings, pension mode/manual GPF, Professional Tax treatment/manual amount, GIS, stamp fee and other deductions. Annual increment, promotion and pay-fixation events require the user to enter the new basic pay fixed by the competent authority.
4. Each dated update carries forward until a later entry changes that component. Multiple entries in the same month are applied in the order entered.
5. For each month, the application calls the existing `calculateSalary` engine using the current effective-dated salary state. It records itemized earnings and employee deductions in the monthly statement.
6. The user enters actual net salary credited for each month from the payslip/bank record, plus any additional recovery to be adjusted from the arrears settlement.
7. Monthly net difference is:

   `Revised calculated take-home - Actual net credited - Additional recovery from arrears`

A final net total and CSV statement are withheld until actual credited pay has been entered for every month. Negative monthly/overall balances are retained and displayed as possible overpayment or recoverable balance; they are not silently clamped to zero.

## Change rules

- Changes take effect for the whole effective month and every later month in the selected period.
- If multiple changes share a month, they are applied in the order entered.
- DA rates and new basic pay must be supported by the applicable signed Government order / pay-fixation statement.
- The tool does not determine increment eligibility, qualifying service, EOL impact, promotion fixation, ACPS entitlement or regularisation eligibility.
- The Department of Personnel's clarification No. 6780/GEN/DOP discusses the effect of EOL on annual-increment dates; employees must confirm the date applicable to their own service record.

## Important assumptions and exclusions

- The opening salary components remain constant until a dated change for that component is entered. Dated allowance/deduction updates are user-entered historical values; the app does not derive them from location, cadre, pay level or an assumed universal order.
- HRA eligibility, HRA rate/minimum, SBCA rate, transport, other earnings, manual pension/GPF, Professional Tax treatment/manual amount, GIS, stamp fee and other deductions can be changed independently from an effective month. Blank fields in the dated change form mean “keep the previous value”.
- CPS/CPF is recalculated by the existing salary engine as 10% of Basic Pay + DA. A dated switch to GPF/manual pension uses the manually entered subscription amount. Professional Tax automatic mode uses the calculator's indicative slabs; select manual mode and use the amount shown on the applicable payslip/order where appropriate.
- Each monthly row and CSV includes an itemized breakdown of DA, HRA, SBCA, transport, other earnings, employee pension/GPF, Professional Tax, GIS, stamp fee and other deductions.
- Actual pay is compared at the net credited level. The planner does not independently reconstruct old gross salary or historical deduction schedules.
- The historical component schedule is not a legal rules engine. Effective months and revised component amounts must be taken from the employee's actual orders, eligibility records and payslips. No interest on arrears, tax recomputation, DA on pre-revised pay, leave salary, partial-month proration, rounding variations between DDO systems or pension revision is calculated.
- An additional recovery must not duplicate a deduction already included in the actual net credited salary.

## Source references

- Finance Department DA circular dated 1 October 2026: https://www.sikkimfred.gov.in/DA%20Enhancement/Documents/DA%20Circular%202026.pdf
- Department of Personnel clarification No. 6780/GEN/DOP on EOL and annual-increment dates: https://dop.sikkim.gov.in/circular/6780.pdf
- Sikkim Government Services (Revised Pay) Rules, 2018: https://www.sikkim.gov.in/uploads/Gazette/333_20240813.pdf

These sources are references for user verification. The application does not hardcode a complete historical DA rate table or assume that an order applies to every employee category.


## Draft persistence and monthly payslip import

- The arrears planner automatically saves its current draft to browser-local storage after the page has restored its initial state. A manual Save control is also available.
- The versioned JSON backup contains the selected period, opening salary inputs, effective-dated changes and each month's actual credited salary / additional recovery.
- JSON restore validates the version, date range, salary field types, change types, effective months, component values, monthly records, duplicate months and a 2 MB size ceiling before replacing the saved draft.
- Incomplete drafts are allowed to be saved. Structural validation is intentionally separate from salary-calculation validation so users do not lose work while filling required salary fields.
- A monthly CSV template contains `month`, `actualTakeHome` and `recovery`. CSV import rejects malformed quoting, duplicate or out-of-period months, negative amounts and files larger than 2 MB. Imported rows replace matching months; months absent from the import retain their existing entries.
- Corrupt or unsupported existing local data is not automatically overwritten on page load. The UI reports the issue and allows the user to import a valid JSON backup.
- Browser local storage is not encrypted and is specific to the browser profile/device. Users should avoid shared/public devices and retain a separate JSON backup. No scenario data is sent to a server.
