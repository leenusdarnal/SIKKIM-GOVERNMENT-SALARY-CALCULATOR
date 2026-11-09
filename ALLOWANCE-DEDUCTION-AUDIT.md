# Allowance and deduction audit

Review date: 9 November 2026  
Implementation branch: `feature/allowance-deduction-safeguards`

## Changes in this increment

1. **Professional Tax is an explicit choice.** The form starts with no Professional Tax treatment selected and blocks salary calculation until the user chooses a manual payslip amount, the optional automatic estimate, or not-applicable / exempt.
2. **Automatic Professional Tax is clearly labelled as an estimate.** The current implementation applies the entered salary slabs to gross monthly earnings (Basic + DA + allowance fields). The exact statutory assessment base, included/excluded components, exemptions and current employee-specific amendments were not conclusively reconciled. Users should prefer their payslip/DDO amount unless they have confirmed the basis.
3. **Historical allowance rates are not treated as universal entitlements.** HRA remains disabled by default; SBCA remains 0% by default. The 12% HRA and 8% SBCA values are described as departmental disclosure references only. HRA minimum remains ₹0 unless an applicable order specifies otherwise.
4. **Posting-specific allowance and deduction fields remain manual.** Transport, compensatory / high-altitude allowance (entered under other earnings), GIS, stamp/fixed fee, GPF and other recoveries are not calculated from pay level alone.
5. **Percentage controls are bounded.** HRA and SBCA percentage inputs are capped at 100% in the calculation engine, in addition to the browser input constraints.

## Official references retained

- **Sikkim Professional Rate-of-tax schedule**, Commercial Taxes Division, Government of Sikkim: http://www.sikkimtax.gov.in/wp-content/uploads/Professional-Rate-of-tax2.pdf
- **CAG Sikkim Civil Report 2008**, Chapter IV, page 121 (historical cross-check of the salary/wage slab boundaries): https://www.cag.gov.in/uploads/old_reports/state/Sikkim/2008/Civil/Civil_Sikkim_2008/civil_chap_4.pdf
- **Notification No. 85/GEN/DOP dated 25 August 2018**, Department of Personnel, Gazette No. 462: https://www.sikkim.gov.in/uploads/Gazette/462_20190418.pdf
- **DESME proactive disclosure under Section 4 of the RTI Act**, Government of Sikkim (departmental HRA / SBCA disclosure): https://www.sikkim.gov.in/uploads/DeptUploads/Final_DESME_Proactive_Disclosure_under_Section_4_of_the_RTI_Ac%281%29_20230411.pdf

## Deliberately not automated

- No universal current HRA / SBCA entitlement by location, cadre or accommodation status has been verified for every Sikkim State Government employee.
- No current universal transport-allowance, GIS subscription or stamp/fixed-fee deduction rate has been verified.
- The 2018 allowance order is retained as a historical baseline; this increment does not claim that every clause remains unchanged or applies to every employee in November 2026.
- The employee's DDO / Accounts section remains the authoritative point for service-specific allowance eligibility, exemptions and current payroll deductions.

## Tests added

- Default Professional Tax state is unselected.
- An unselected Professional Tax treatment produces no calculated tax amount.
- Manual Professional Tax uses the amount entered rather than an automatic slab.
- HRA and SBCA percentage calculations are capped at 100%.
- Existing Professional Tax slab boundary and salary calculation tests remain in place.

## Validation

The GitHub Actions workflow for this branch is the validation gate for Svelte / TypeScript checks, unit tests and production build. This file records the scope and limits of the implementation, not a claim that unverified rules have been made automatic.
