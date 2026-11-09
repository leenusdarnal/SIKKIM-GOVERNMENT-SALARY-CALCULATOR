# Initial implementation audit — salary rule safeguards

Review date: 9 November 2026  
Branch: `feature/salary-rule-safeguards`

## Findings addressed in this increment

1. **Pension scheme was preselected as CPS.** The calculator now starts with an unselected scheme and blocks calculation until the user chooses CPS/CPF, GPF, manual contribution, or no employee contribution / OPS as applicable. The calculation engine also has an explicit `unselected` state and makes no pension deduction in that state.
2. **HRA and SBCA were implicitly included in every estimate.** HRA now starts disabled; SBCA starts at 0%. The reference HRA and SBCA fields remain editable and must be applied only when supported by the employee's posting and entitlement.
3. **No salary month was requested.** A month selector was added. The known 60% DA reference is effective 1 January 2026. Choosing an earlier month clears DA to 0 and prompts the user to enter the historically applicable rate; the calculator does not invent a missing DA history.
4. **Pay-matrix source description was insufficient.** The official Government PDF is Notification No. 56/GEN/DOP dated 23 June 2018 and includes the Schedule, Part A (Pay Matrix). The State Bank-hosted PDF is separately disclosed as the operational reference supplied by the project owner, not as a separate salary scheme for bank employees. It contains selected levels only; the complete Government schedule remains the full-level cross-check.

## Known limitations still open

- The 920 pay-matrix values still need a full cell-by-cell comparison against the 2018 Government schedule, using a machine-readable transcription and review.
- The DA history table before 1 January 2026 is not yet complete; historical months require manual DA entry.
- CPS/CPF versus OPS coverage needs to be represented using the applicable individual service order and current Department of Personnel guidance. Appointment date alone is not treated as conclusive.
- HRA, SBCA, transport, compensatory / high-altitude allowance, GIS and stamp fee remain employee-specific; current universal entitlement rules have not been fully verified.
- Professional Tax slab calculation needs a further legal review of the applicable assessment base and any current amendments.
- This is an estimate tool, not official payroll software.

## Validation targets

- Run `npm run check`, `npm test`, and `npm run build`.
- Confirm that an unselected pension scheme blocks the UI calculation.
- Confirm that an earlier salary month does not retain the current 60% DA default.
- Confirm that selecting CPS displays the employee contribution and matching State share separately.
