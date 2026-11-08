# Sikkim Government Salary Calculator

A browser-based estimate calculator for employees drawing pay under the **Sikkim Government Services (Revised Pay) Rules, 2018**. It supports the 23-level pay matrix already included in the app and separates statutory calculations from allowances and deductions that depend on an employee's service conditions.

> **Not an official payroll calculator.** Confirm all rates, allowances, eligibility and recoveries with the current Government of Sikkim Finance Department order and your DDO / Accounts section before relying on an estimate.

## Features

- 23 pay levels and 40 pay cells per level, retained from the app's Sikkim pay-matrix data.
- DA percentage selector with a 60% default for revised-pay estimates (publicly reported as effective 1 January 2026); historical/custom rates remain selectable.
- Editable HRA and SBCA rates, HRA eligibility switch and optional HRA minimum.
- Manual transport and other monthly allowance inputs. No unsupported level-based transport amount is assumed.
- Sikkim CPF / Contributory Pension Scheme employee contribution at 10% of Basic Pay + DA, with the matching State contribution shown separately and excluded from employee deductions.
- GPF/manual pension contribution option for employees not covered by the contributory scheme.
- Professional Tax calculated by monthly salary slab, with manual and not-applicable overrides.
- Editable GIS, stamp/fixed fee, TDS, loan and other deduction amounts.
- Detailed earnings/deductions, take-home estimate, dark mode, responsive layout and PDF export.

## How to use

1. Open `index.html` in a modern browser.
2. Select the pay level and pay-matrix cell matching the employee's Basic Pay.
3. Select the DA rate applicable to the salary month. The default 60% is based on public reporting for Sikkim's revised-pay structure; verify it against the signed Finance Department circular.
4. Open **Allowances, pension and deductions — customise**.
5. Set HRA eligibility/rate and SBCA rate to the employee's applicable order. Enter transport and other allowances only where admissible.
6. Select CPF/CPS, GPF, manual pension or no pension as appropriate. Enter the date of appointment to help check the general CPS cut-off; date alone does not establish coverage because rule exclusions apply.
7. Leave Professional Tax on automatic for the salary-earner slab, or use a manual amount from the payslip.
8. Enter GIS, stamp fee, TDS, loan and other deductions from the employee's actual record. They default to zero because a universal current deduction rate was not verified.
9. Calculate and review the detailed statement. Use the PDF export for a copy.

## Calculation rules and defaults

| Component | Current app behaviour | Evidence / qualification |
|---|---|---|
| Pay matrix | Uses Sikkim 2018 revised-pay levels/cells | Government of Sikkim Notification No. 56/GEN/DOP dated 23 June 2018; effective 1 January 2016 |
| DA | 60% default from 1 January 2026; user can change it | Public reporting of a Sikkim Finance Department revision. The original signed circular is not linked here, so verify before payroll use. |
| HRA | 12% reference default; no minimum by default; can be zeroed | A Government of Sikkim departmental RTI disclosure lists 12%, but that is not proof of a universal current rate. |
| SBCA | 8% reference default | Same departmental disclosure limitation as HRA; editable. |
| Transport / other allowances | Zero unless entered | No universal current amount is assumed. |
| CPF / CPS | 10% of Basic Pay + DA for selected covered employees | Sikkim Government Servants (Contributory Pension) Rules, 2006. The State matching contribution is displayed separately. |
| GPF | Employee-entered monthly amount | Depends on the applicable employee/service record. |
| Professional Tax | Auto: up to ₹20,000 nil; ₹20,001–30,000 ₹125; ₹30,001–40,000 ₹150; above ₹40,000 ₹200 per month | Uses the Government of Sikkim Commercial Taxes Division salary-earner schedule. A manual override is provided for exemptions or payroll-specific treatment. |
| GIS / stamp / TDS / loans | Zero unless entered | No universal current GIS/stamp amount is hardcoded; use the employee's actual deduction. |

The percentage-derived components are rounded to the nearest rupee (50 paise and above round up). Automatic Professional Tax uses the calculated regular monthly earnings as its salary base; actual payroll classification and exemptions should be confirmed.

### Important pension distinction

The 2006 Sikkim Contributory Pension Rules generally cover employees appointed on or after 1 April 2006 to posts on the new contributory pensionable establishment. The rules contain exclusions, including daily-rated and work-charged employees, contingency-paid employees, All India Services and contract employees unless their contract provides otherwise. The employee contribution is 10% and the State makes a matching contribution. The matching amount is **not** an employee deduction and is **not** added to take-home pay.

### Privacy

The calculator runs in the browser and does not ask for employee name, employee number, bank details or other personal identifiers. Avoid entering personally identifying details in any custom field. The app uses local storage only for the visual theme preference.

## Sources and verification

See [SOURCES.md](SOURCES.md) for the source register, exact notifications and the limitations attached to each default. Worked calculation examples are in [tests/salary-calculation-cases.md](tests/salary-calculation-cases.md).

## Project files

- `index.html` — single-file calculator.
- `SOURCES.md` — legal / official source register and verification notes.
- `tests/salary-calculation-cases.md` — manual regression cases for salary slabs and pension arithmetic.

## License

No license file has been added to this repository yet. Check with the repository owner before reusing or redistributing the code.
