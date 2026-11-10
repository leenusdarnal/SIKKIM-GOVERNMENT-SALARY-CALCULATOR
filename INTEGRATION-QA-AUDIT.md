# Integration QA audit — Sikkim Professional Tax and salary modules

## Finding and correction
The shared salary engine previously calculated automatic Professional Tax using gross-monthly-income slabs. This did not match the Sikkim-specific pay-level rule supplied for this calculator. The engine now uses an explicit pay-level band:
- Below Level 15: ₹150 per month.
- Level 15 and above: ₹200 per month.

The engine does not infer the band from gross salary. The regular pay-matrix calculator sets the band from the selected pay level; the payslip and arrears worksheets require an explicit band selection whenever automatic Professional Tax is chosen. Manual override and not-applicable options remain available.

## Cross-module changes
- `src/lib/salary.ts`: shared `SalaryInput` includes a typed Professional Tax pay-level band; automatic calculation uses the band, not gross pay.
- `src/lib/components/SalaryCalculator.svelte`: derives the band from the selected Sikkim pay-matrix level and updates explanatory copy.
- `src/lib/payslip.ts` and `src/routes/payslip-generator/+page.svelte`: automatic Professional Tax requires a selected band; UI presents both Sikkim bands.
- `src/lib/arrears.ts` and `src/routes/arrears-planner/+page.svelte`: opening salary basis and effective-dated changes support pay-level band selection; automatic mode is blocked when the band is missing.
- Salary, payslip and arrears tests cover band boundaries, missing-band safeguards and monthly application.

## Rule-source limitation
The ₹150 / ₹200 amounts and Level 15 threshold are based on the user's previously supplied Sikkim rule. Before treating this as a legally authoritative payroll configuration, attach or confirm the current Sikkim Government notification / circular and check applicability and exemptions with DDO / Accounts. This audit does not claim an independent legal verification of the underlying notification.

## QA boundaries
- No central-government gross-income slabs are used for automatic Sikkim PT.
- Manual PT and exempt/not-applicable paths remain explicit.
- This change does not modify CPS, GPF, GIS or other deduction formulas.
- No employee data is sent to a server by these local calculation modules.
- No merge or production deployment is performed as part of this QA stage.

## Additional payslip QA corrections
- Annual-to-date totals now include only records from the selected financial/calendar year up to and including the selected month; later months in the same year are excluded.
- Payslip validation now rejects non-finite, negative, or out-of-range salary inputs and requires explicit pension/GPF and Professional Tax treatment rather than silently presenting a zero deduction as a completed calculation.
- CSV text cells now neutralize spreadsheet formula prefixes (=, +, - and @) before export to reduce formula-injection risk when the file is opened in spreadsheet software.
- Regression tests cover annual cut-off, malformed salary inputs, unselected deduction treatments and formula-prefixed employee names.

## Arrears persistence QA correction
- Draft backup validation previously omitted the Sikkim Professional Tax pay-level band from its salary-update allowlist. A dated move between the below-Level-15 and Level-15-and-above bands could therefore be rejected during backup validation even though the arrears calculation accepted it.
- The storage validator now validates and preserves `professionalTaxLevelBand` in both the opening salary basis and effective-dated salary changes.
- A backup containing only a historical-rate schedule or only a selected-component list is now rejected as structurally inconsistent. Both must be present together, matching the calculation engine's contract.
- Regression tests cover pay-level-band round-trip and mismatched historical schedule/component data.

## GPF planner default-input QA
- Integration review found that the GPF planner prefilled reference pay with ₹56,000, which could be mistaken for an employee-specific or recommended value.
- The planner now starts with reference pay set to zero, displays no calculated contribution or limits until a valid reference-pay figure is entered, and explicitly states that no employee pay is pre-filled.
- The employee must still confirm the correct reference-pay basis for the relevant subscription year with the service/pay record and Accounts/DDO section. The 6%–100% rule range and the planner's other limitations remain unchanged.


## CPS / OPS integration QA — 10 November 2026

### Government-reference context
- The Finance Department's PGIPF Division information describes the State's Contributory Pension Scheme for covered employees appointed after 1 April 2006, with an employee contribution of 10% of Basic Pay plus DA and an equal State contribution. Reference: [Finance Department — Pension, Group Insurance Schemes, Contributory Pension Scheme and GPF (PGIPF Division)](https://www.sikkim.gov.in/department/departmentmenudetails?url=Menu%3Dfinance-revenue-expenditure-department%2Fpension-group-insurance-schemes-contributory-pension-scheme-and-general-provident-fund-pgipf-division).
- Department of Personnel Notification No. 23/GEN/DOP dated 09.02.2024 announced restoration of the Old Pension System with a view to bring State Government employees appointed on or after 01.04.2006 under the Sikkim Services (Pension) Rules, 1990. The notification stated that detailed guidelines on reversion modalities would be issued separately. Reference: [Notification No. 23/GEN/DOP dated 09.02.2024](https://dop.sikkim.gov.in/notificationdoc/23.pdf).
- Accordingly, appointment date is not used by this calculator to infer an individual's current CPS / OPS status. The signed pension option, service record, any later Government orders and DDO / Accounts implementation records must establish the applicable arrangement. The calculator does not claim to verify legal membership.

### Code and cross-module safeguards
- `src/lib/salary.ts`: added optional `cpsMembershipConfirmed` to `SalaryInput`. A selected CPS mode returns zero employee and State contributions until the flag is explicitly true. Once confirmed, the shared engine applies its configured 10% employee contribution on Basic Pay + DA and shows the equal State share separately.
- `src/lib/components/SalaryCalculator.svelte`: selecting CPS exposes an attestation checkbox requiring confirmation against the employee-specific signed pension option / service records and DDO / Accounts. Changing the selected scheme clears the attestation. Calculation is blocked until confirmation.
- `src/lib/payslip.ts` and `src/routes/payslip-generator/+page.svelte`: CPS payslip validation is blocked without confirmation. Changing the scheme clears the attestation. The employer / State matching share is informational only and is not included in employee deductions or take-home reduction.
- `src/lib/arrears.ts` and `src/routes/arrears-planner/+page.svelte`: opening CPS basis requires explicit confirmation; a dated change to CPS must carry a separate confirmation for that effective month. Changing the selected arrangement clears the UI attestation.
- Arrears month rows and totals now include the employer / State matching share as a separate reporting field. Arrears audit CSV, final CSV and print statement show it separately; it is not added to employee deductions or used to reduce revised take-home.
- `src/lib/arrears-storage.ts`: the new flag is persisted. Older version-1 drafts without the optional field remain structurally loadable, but any draft that selects CPS without re-confirmation is blocked by arrears calculation.
- Tests cover unconfirmed CPS blocking, successful confirmation, cross-module payslip / salary-engine consistency, State match separation, arrears dated-switch confirmation and legacy draft compatibility.

### Formula and applicability limitation
The 10% Basic Pay + DA employee / equal State contribution is the Finance Department's published scheme description used by this calculator. The individual's scheme coverage, option status, precise contribution base and any subsequent implementation instructions must still be confirmed against applicable orders and service / DDO records before payroll use. This change does not apply CPS universally, infer OPS automatically, or treat the checkbox as Government approval.



## GPF deduction integration QA — 10 November 2026

### Rule basis and boundaries
- The Sikkim General Provident Fund (Sikkim Services) Rules, 1984, Notification No. 8/Fin dated 16.10.1984 (effective 01.01.1985), prescribe a minimum subscription of 6% and a maximum of 100% against the applicable reference emoluments. The source register points to the [Sikkim Finance Department rule page](http://www.sikkimfred.gov.in/user/Rules_1984.aspx).
- The relevant GPF reference-pay basis is tied to the preceding 31 March under the cited rules. The employee must enter the applicable reference pay confirmed by Accounts / DDO for the subscription year. The application does not substitute current Basic Pay automatically.
- GPF membership/account status and authority to subscribe are not inferred from appointment date or from selecting GPF in the dropdown. The employee-specific service record and Accounts / DDO confirmation remain necessary.

### Shared calculation safeguards
- `src/lib/salary.ts` adds optional `gpfMembershipConfirmed` and `gpfReferencePay` fields plus `validateGpfSubscription()`. A GPF deduction is included only when membership/account status is confirmed, reference pay is positive and the entered monthly subscription lies between the rounded 6% minimum and 100% maximum.
- The shared salary engine continues to treat GPF as an employee deduction only. It creates no employer / State matching contribution. The CPS employer matching field remains zero for GPF.
- The main salary calculator requires the GPF attestation, Accounts-confirmed reference pay and monthly subscription before calculating. Changing the pension arrangement clears the GPF confirmation.
- The payslip model rejects GPF when confirmation, reference pay or subscription range is invalid. Its UI asks for the reference pay and account confirmation, and the CSV carries the pension arrangement / GPF reference-pay context.
- The arrears planner validates the opening GPF basis and simulates every effective-dated salary state month by month before calculating. A switch to GPF requires account confirmation, reference pay and a valid monthly subscription for that effective month. Later changes to only the subscription amount are also revalidated against the carried-forward reference pay.
- Arrears draft storage and JSON backup preserve the new fields. Older drafts that omit the optional GPF fields remain structurally loadable; if such a draft selects GPF, calculation is blocked until the missing information is supplied.
- The standalone GPF planner starts with no prefilled reference pay and links to the Sikkim GPF Rules. It remains an illustration and does not decide account membership.

### Regression coverage
- Tests cover the 6% and 100% boundaries, missing / invalid reference pay, unconfirmed membership, employee deduction / take-home arithmetic, no employer match under GPF, payslip gating, arrears opening and effective-dated changes, persistence round-trip and legacy draft compatibility.
- GPF validation uses the same shared salary engine rule limits in the main calculator, payslip and arrears modules. No GPF amount is assumed or auto-derived from current Basic Pay.

### Limitation
This is a calculation safeguard, not an official GPF account verification or payroll authorization. Confirm the current amended rule text, applicable reference emoluments, subscription election and any permitted subscription change with the Accounts / DDO section before using the output for payroll.


## Retirement estimator boundary QA — 10 November 2026

- Pension estimation now requires both a positive pensionable-emoluments base and positive pension percentage when the pension section is used.
- Commutation is either wholly unused or requires both a positive percentage and approved multiplier, plus a valid positive pension estimate.
- Gratuity and leave encashment now require complete input sets when either section is used; partial formula inputs are rejected.
- Invalid/incomplete inputs suppress all monetary result fields instead of leaving partial amounts visible beside validation errors.
- Derived calculations must fit within the safe whole-rupee numeric range. Overflow/unsafe results are rejected.
- Tests cover percentage boundaries, residual pension, gratuity ceilings, leave divisors, rounding, missing formula values, negative/non-finite values and overflow.
- No scheme eligibility, formula, service unit, ceiling or leave entitlement has been preloaded or inferred.


## Mobile, accessibility and print QA — 10 November 2026

### Shared responsive and accessibility safeguards
- Added touch-friendly interaction sizing for buttons and checkbox/radio controls, manipulation touch-action, responsive wrapping for shared section headers, and reduced-motion support.
- Improved contrast for shared eyebrow and field-help text in light and dark themes.
- Added consistent table semantics defaults for vertical alignment and header emphasis; existing data tables retain their explicit horizontal-scroll wrappers where minimum widths are required.
- Kept visible keyboard focus treatment and native input labels; no visual browser/device audit is claimed by this code-level pass.

### Print output corrections
- Monthly payslip print now isolates the payslip statement, excluding the input form, annual history, navigation and export controls.
- Retirement print now isolates the validated result section; the invalid-result state still disables the print action.
- Arrears print now isolates the generated statement, repeats table headers across pages, avoids splitting individual rows and allows the statement to flow across pages rather than forcing the entire report onto one page.
- Shared print defaults now normalize page colors, table layout and print controls.

### Verification boundary
- Changes are committed on `feature/historical-rate-schedule-engine` under PR #17.
- GitHub Actions must complete against the new branch head before this stage is considered CI-verified.
- Visual viewport testing with real mobile devices / browser emulation and physical/PDF print-preview inspection remain part of final end-to-end QA; they are not claimed as completed here.
- No merge or production deployment has been performed.


## Final integration QA corrections — 10 November 2026

### Shared regular-salary input validation
- Added `validateSalaryInput()` to the shared salary module. It validates all regular salary numeric inputs, basic pay, percentage limits, HRA eligibility type, pension treatment, CPS/GPF confirmation, GPF reference-pay/subscription constraints and Professional Tax treatment/pay-level band.
- The main salary calculator now uses the shared validator before displaying a salary result. Payslip and arrears use the same validator rather than maintaining separate regular-salary rules.
- The regular calculator's former temporary-pay shortcut has been replaced with a link to the guarded `/temporary-pay` workflow. This removes a path that could show notification amounts without date/applicability confirmation.

### Range and aggregation safety
- Shared salary validation rejects unsafe monetary inputs and derived outputs outside the supported safe whole-rupee range.
- Payslip annual aggregates are validated after summation; invalid totals withhold the model output, print and CSV export. Invalid months cannot be added to the annual summary.
- Arrears validates actual credited amounts and recoveries and rejects unsafe period totals before returning monthly result rows.
- GPF annual illustrations and temporary-driver daily-wage multiplication now reject overflow / unsafe totals.
- Regression tests cover salary input boundaries, payslip annual overflow, arrears input and aggregate overflow, GPF annual overflow and temporary daily-wage overflow.

### Workflow consistency and UI corrections
- The payslip UI withholds gross, deductions, net pay, statement breakdown and annual totals whenever validation fails. Print and add/update-month actions are disabled while invalid; CSV generation is already guarded by the model.
- The pay-progression increment scenario now lets the user select the calendar year rather than hard-coding the 2026 Jan/Jul options. The date remains a record/scenario input and does not determine entitlement.
- Browser theme persistence now fails gracefully where localStorage is unavailable; the in-memory theme control remains usable.
- The project structure section in README uses separate real lines for the historical rate engine and editor.
- Arrears, payslip and retirement print rules were corrected to select their intended report sections with valid CSS selectors. The retirement results section is explicitly tagged as the print target.

### Verification boundary
- Regression automation is being run against the updated PR branch head. Check the linked GitHub Actions result for the exact committed head before merging.
- This code-level QA does not claim visual browser emulation, device testing or physical/PDF print-preview inspection. Those remain manual final QA checks.
- No PR merge or production deployment has been performed.


## Browser visual QA follow-up — 10 November 2026
- A Vercel preview was created for PR #17 head `6646cf1cc7d01f2987e420eaa8b58c3fd5a73f0c`; it is a preview deployment only and is not production.
- Read-only browser QA covered all seven routes at desktop 1440×900 and mobile 390×844. All routes loaded, no measured horizontal overflow or captured runtime/console errors were reported, and form controls had associated labels. Keyboard focus indicators were visible.
- Homepage utility links wrapped awkwardly on mobile and the compact workspace title was truncated. The utility links have been converted into a semantic, two-column mobile navigation grid and the mobile header now uses a shorter title.
- The arrears print route previously produced a blank print-media page when no complete statement existed. A clearly labelled withheld-state print report is now rendered in that case; the actual print action remains disabled until a valid, complete statement is available.
- Print-media inspection (not a separate system print-preview window): payslip shows a withheld notice when invalid; retirement shows the configured zero-value illustration; arrears now shows a withheld notice when incomplete.
- No employee data was entered, no form was submitted and no PDF was saved. Populated calculation and populated-report printing remain untested. A further preview build and browser pass are required after these code changes.


### Follow-up code validation — 10 November 2026
- Mobile homepage navigation changed from a loose wrapping link string to a semantic `nav` with a two-column small-screen grid. The compact workspace title now uses “Sikkim Salary” on narrow screens.
- The arrears planner always renders a printable withheld-state notice when a complete statement is unavailable. The actual statement print button remains disabled until the calculation and all actual credited-pay entries are complete; the audit CSV remains available.
- Latest GitHub Actions run [42807618376](https://github.com/leenusdarnal/SIKKIM-GOVERNMENT-SALARY-CALCULATOR/actions/runs/42807618376) passed on PR head `39bc6b64068131110586d3441dfcede6d83044fe`: 12 test files / 142 tests, Svelte check 0 errors / 0 warnings, and Vercel adapter production build succeeded.
- The browser visual run covered the previous PR head `6646cf1cc7d01f2987e420eaa8b58c3fd5a73f0c`. The updated mobile navigation and withheld arrears print notice are covered by the latest CI build but could not be re-opened in a new Vercel preview: the Vercel Git deployment status for the newer commit is rate-limited and instructs retry after 24 hours. Do not treat the older preview as the current code.
- The temporary preview share URL is time-limited and should not be reused after its expiry. No production alias was changed.
