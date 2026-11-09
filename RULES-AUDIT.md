# Initial implementation audit — salary rule safeguards

Review date: 9 November 2026  
Branch: `feature/salary-rule-safeguards`

## Findings addressed in this increment

1. **Pension scheme was preselected as CPS.** The calculator now starts with an unselected scheme and blocks calculation until the user chooses CPS/CPF, GPF, manual contribution, or no employee contribution / OPS as applicable. The calculation engine also has an explicit `unselected` state and makes no pension deduction in that state.
2. **HRA and SBCA were implicitly included in every estimate.** HRA now starts disabled; SBCA starts at 0%. The reference HRA and SBCA fields remain editable and must be applied only when supported by the employee's posting and entitlement.
3. **No salary month was requested.** A month selector was added. The known 60% DA reference is effective 1 January 2026. Choosing an earlier month clears DA to 0 and prompts the user to enter the historically applicable rate; the calculator does not invent a missing DA history.
4. **Pay-matrix source description was insufficient.** The official Government PDF is Notification No. 56/GEN/DOP dated 23 June 2018 and includes the Schedule, Part A (Pay Matrix). The State Bank-hosted PDF is separately disclosed as the operational reference supplied by the project owner, not as a separate salary scheme for bank employees. It contains selected levels only; the complete Government schedule remains the full-level cross-check.

## Updated status after the pay-matrix audit

- The 2018 Schedule Part A transcription has now been reconciled cell by cell. See [PAY-MATRIX-AUDIT.md](PAY-MATRIX-AUDIT.md). The old 920-entry padded matrix was replaced with 794 printed cells and the identified incorrect values were corrected.
- The DA rate is verified in this implementation only for January–November 2026. Earlier historical months and future months require manual DA entry from the applicable order.
- CPS/CPF versus OPS coverage needs to be represented using the applicable individual service order and current Department of Personnel guidance. Appointment date alone is not treated as conclusive.
- HRA, SBCA, transport, compensatory / high-altitude allowance, GIS and stamp fee remain employee-specific; current universal entitlement rules have not been fully verified.
- Professional Tax slab calculation needs a further legal review of the applicable assessment base and any current amendments.
- This is an estimate tool, not official payroll software.

## Validation targets

- Run `npm run check`, `npm test`, and `npm run build`.
- Confirm that an unselected pension scheme blocks the UI calculation.
- Confirm that an earlier salary month does not retain the current 60% DA default.
- Confirm that selecting CPS displays the employee contribution and matching State share separately.


## Allowance and deduction safeguards — 9 November 2026

- Professional Tax now starts in an unselected state. The user must choose a manual payslip amount, an optional automatic gross-pay estimate, or not-applicable / exempt before calculating. The automatic estimate is explicitly labelled because the statutory assessment base, exclusions and individual exemptions have not been fully reconciled.
- HRA remains disabled by default. The 12% HRA and 8% SBCA references are described as departmental disclosures only; SBCA remains 0% until entered by the employee. No 2018 allowance is treated as a universal current entitlement.
- The Department of Personnel's Notification No. 85/GEN/DOP dated 25 August 2018 (Gazette No. 462) is added to the source register as a historical allowance baseline effective from 1 September 2018. Current amendments and employee/posting-specific applicability still require confirmation.
- Transport, GIS, stamp/fixed fee, compensatory / high-altitude and other posting-specific amounts remain manual. GPF remains manual because the current employee-specific contribution is not inferable from pay level alone.
- HRA and SBCA percentage inputs are bounded at 100% in the calculation engine. Tests cover the required Professional Tax choice, existing slab boundaries and percentage bounds.

See [ALLOWANCE-DEDUCTION-AUDIT.md](ALLOWANCE-DEDUCTION-AUDIT.md) for the detailed scope and limitations.


## Temporary and training pay implementation — 9 November 2026

- Added the Department of Personnel Notification No. M(164)/42/GEN/DOP dated 12 August 2026, which supersedes the 2018 temporary consolidated-pay notification.
- Implemented the five Group C/D equivalent-grade-pay rows and all 16 specific-post consolidated-pay rows as separate temporary-pay options.
- Added the direct-recruit first-year training allowance rates from Notifications J(1)/86-GEN/DOP and J(1)/87/GEN/DOP, both dated 25 July 2024, split by group and training location.
- Temporary driver pay is not hardcoded: the 2026 notification refers to Labour Department daily-wage rates but does not specify the amount. The calculator requires a manual daily rate and payable days.
- Regularisation is described only as a 2024 transitional reference for a specifically defined cohort. No automatic regularisation eligibility, pay level, cell or pay-fixation calculation is made because Notification No. 99/GEN/DOP and later amendments have not yet been fully audited.
- Temporary consolidated pay is kept separate from regular salary calculations. DA, HRA, SBCA and pension deductions are not automatically added. Deductions and other terms require the appointment order / DDO bill.
- Added regression tests for the prescribed monthly rates, all 16 special-post rows, training rates and manual driver calculations.

See [TEMPORARY-PAY-AUDIT.md](TEMPORARY-PAY-AUDIT.md).


## Pay progression and service history — 9 November 2026
- Added a separate pay-progression page with exact matrix-cell lookup and increment scenarios requiring explicit user confirmation of eligibility.
- Added local chronological service-history entries for appointment, annual increment, promotion, financial upgradation, regularisation and manual correction.
- Added validation that rejects nonexistent cells and out-of-order history entries.
- Audited Notification No. 99/GEN/DOP dated 6 February 2020, the 2024 regularisation transition, the 3 March 2025 ACPS memorandum and the narrow 2021 Sikkim Houses increment restriction.
- No generic direct-recruit initial fixation, promotion fixation, retrospective arrears or universal MACP calculation is automated. Rule 7's 2.57 factor is the 2016 transition, not a general current appointment formula.
- See [PAY-PROGRESSION-AUDIT.md](PAY-PROGRESSION-AUDIT.md).
