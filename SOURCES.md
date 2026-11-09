# Source register and verification notes

This file records which calculation inputs are backed by Government of Sikkim material and which remain editable estimates. Source review date: **9 November 2026**. The framework rewrite keeps the earlier source assessment unchanged; the SvelteKit port itself does not constitute a fresh legal audit.

## 1. Pay matrix — primary Government source

**Sikkim Government Services (Revised Pay) Rules, 2018**, Notification No. **56/GEN/DOP**, dated **23 June 2018**. The Rules state that they are deemed to have come into force on **1 January 2016** and apply to eligible State services/posts (with listed exclusions).

- Official Government of Sikkim Finance Department PDF: https://www.sikkim.gov.in/uploads/Gazette/333_20240813.pdf
- The complete Schedule Part A contains 23 levels and 794 printed pay cells. Levels 1–14 contain 40 cells each; Levels 15–23 contain 36, 35, 32, 28, 26, 23, 19, 18 and 17 cells respectively. The calculator now stores only cells actually printed in the Government schedule; it does not extrapolate higher cells.

**Operational reference supplied for this project:** https://www.statebankofsikkim.com/SBSPAYMATRIX.pdf. As clarified by the project owner, this PDF is used as a pay-matrix reference for Sikkim State Government employees; it is not a separate State Bank of Sikkim employee salary scheme. The copy displays selected levels (4–7, 9–12, 14–17 and 19–22), while the Government Rules schedule remains the full 23-level authority. Missing levels must not be dropped from the State Government calculator.

## 2. DA — Finance Department circular effective 1 January 2026

The Sikkim Finance Department circular dated **1 October 2026**, Circular No. **GOS/1(32)/Bud/Fin/2001-2002/Part II/07**, revises DA under the revised pay structure from **58% to 60%**, with effect from **1 January 2026**. The corresponding pre-revised pay rate is **262%**.

- Primary Government circular: https://www.sikkimfred.gov.in/DA%20Enhancement/Documents/DA%20Circular%202026.pdf
- Secondary report identifying the circular and effective date: https://www.indiatodayne.in/sikkim/story/sikkim-govt-hikes-da-for-employees-dearness-relief-for-pensioners-1457702-2026-10-01

The circular's rounding instruction is to round 50 paise or more up to the next rupee and ignore amounts below 50 paise. The calculator uses whole-rupee rounding for DA.

**Calculator treatment:** 60% is the latest located revised-pay reference and remains editable. This is not a full historical DA table. For months outside the currently verified January–November 2026 window, the app clears the default DA rate and requires manual entry from the applicable circular or payslip. Check for later orders and confirm the category covered by the circular. Employees on pre-revised pay are outside this revised-pay calculator.

## 3. Contributory Pension Scheme — primary Government rules

**Sikkim Government Servants (Contributory Pension) Rules, 2006**, Notification No. **70/PN/117/Pen/05**, dated **18 May 2006**, published in the Sikkim Government Gazette on 24 May 2006.

- Official Government of Sikkim Finance Department PDF (Volume III; Annexure XVII): https://www.sikkimfred.gov.in/FCD/Documents/Vol%20III.pdf
- The Rules are deemed to have come into force on 1 April 2006.
- They generally apply to Government servants appointed on or after 1 April 2006 to posts borne on the new contributory pensionable establishment, subject to the exclusions in Rule 2.
- Rule 4 provides for a monthly employee contribution of 10% of Basic Pay, dearness pay and DA, with a matching State contribution.

**Calculator treatment:** For the revised-pay structure, the employee's CPF/CPS contribution is calculated as 10% of Basic Pay + DA. The matching State contribution is displayed separately and excluded from employee deductions and in-hand pay. Employees not covered by the scheme should select GPF/manual or no pension, as applicable. Appointment date alone does not settle coverage: the establishment and Rule 2 exclusions must also be checked.

## 4. Professional Tax — current official schedule

The Commercial Taxes Division, Government of Sikkim, lists **Professional Rate-of-tax** on its official notifications page, dated **8 November 2026**, with a direct PDF:

- Official notifications page: http://www.sikkimtax.gov.in/notifications-circulars/annual-reports/
- Direct official salary-earner schedule: http://www.sikkimtax.gov.in/wp-content/uploads/Professional-Rate-of-tax2.pdf
- The PDF is headed *The Sikkim Tax on Professions, Trades, Callings and Employment Act, 2006*, Schedule (see section 4).

**Calculator interpretation for salary/wage earners:** up to ₹20,000 per month — nil; ₹20,001–₹30,000 — ₹125; ₹30,001–₹40,000 — ₹150; ₹40,001 and above — ₹200. The current PDF text has inconsistent boundary wording in places, but an earlier Sikkim CAG audit explicitly records these salary ranges and rates under the 2006 Act:

- CAG, Audit of Transactions, Sikkim Civil Report 2008, Chapter IV, page 121: https://www.cag.gov.in/uploads/old_reports/state/Sikkim/2008/Civil/Civil_Sikkim_2008/civil_chap_4.pdf

The slab boundaries implemented here follow that Sikkim-specific CAG audit cross-check. The automatic mode in the calculator applies these indicative slabs to gross monthly earnings (Basic + DA + entered allowances). The precise statutory assessment base, exclusions, exemptions and subsequent amendments have not been conclusively verified for every employee category. Accordingly, Professional Tax is no longer calculated by default: the user must explicitly select a manual payslip amount, the optional automatic estimate, or not-applicable where exempt.

## 5. HRA and SBCA — historical departmental reference only

A Government of Sikkim proactive disclosure by the Directorate of Economics, Statistics, Monitoring and Evaluation records HRA at **12%** and SBCA at **8%** in its remuneration section:

- Official Government of Sikkim disclosure (PDF, page showing remuneration/allowances): https://www.sikkim.gov.in/uploads/DeptUploads/Final_DESME_Proactive_Disclosure_under_Section_4_of_the_RTI_Ac%281%29_20230411.pdf

**Important limitation:** This is a departmental disclosure, not a current State-wide order proving universal entitlement or rates for every employee. The 2008 Sikkim CAG audit had previously cited a 15% HRA rule for employees posted within Sikkim, showing why an older rate cannot safely be applied universally. The 12% rate is retained only as an editable departmental reference default; the app does not assume a ₹3,500 HRA minimum. The HRA-eligibility switch must be turned off where accommodation is provided or HRA is otherwise inadmissible.

- CAG, Sikkim Civil Report 2008, Chapter IV, page 121 (historical HRA audit reference): https://www.cag.gov.in/uploads/old_reports/state/Sikkim/2008/Civil/Civil_Sikkim_2008/civil_chap_4.pdf

## 6. Historical allowance order — not a universal current entitlement

Government of Sikkim, Department of Personnel, **Notification No. 85/GEN/DOP dated 25 August 2018**, published in Gazette No. 462 (18 April 2019):

- Official Gazette PDF: https://www.sikkim.gov.in/uploads/Gazette/462_20190418.pdf
- The order records location/category-dependent allowances, including HRA, SBCA, compensatory allowance, high-altitude allowance and transport allowance. Its baseline took effect from 1 September 2018.
- The order is retained as a historical reference. This review did not establish that every rate and eligibility condition remains current in November 2026 or that each category applies to every State employee.

**Calculator treatment:** HRA starts disabled; the 12% HRA and 8% SBCA figures are labelled departmental references, not universal entitlements; SBCA starts at 0%; HRA minimum starts at ₹0. Transport, compensatory / high-altitude and other posting-specific allowances remain manual. No employee is assigned an allowance solely because a location or pay level is selected.

## 7. GIS, stamp/fixed fee, transport and other allowances/deductions

No current universal State-wide GIS deduction amount, salary stamp fee, or uniform level-based transport allowance was verified from a primary source during this implementation.

**Calculator treatment:**
- GIS and stamp/fixed fee default to ₹0 and are manually entered from the employee's payslip/order.
- Transport allowance defaults to ₹0 and is manually entered only if admissible.
- Other recurring allowances and deductions, including TDS/income tax and loan recoveries, are optional manual entries.
- No central-government allowance rate is applied automatically to Sikkim State employees.

## 8. Maintenance protocol

When a new Government of Sikkim order is issued, update the rule data only after checking:
1. Issuing department and notification/circular number.
2. Date of issue and effective date (these may differ).
3. Covered employee groups and exclusions.
4. Whether the order applies to revised pay, pre-revised pay, pensioners or specific cadres.
5. Rounding, arrears and recovery rules.
6. A worked salary example against a real redacted payslip or DDO calculation.

Never overwrite the editable reference fields with an unverified news report or a Central Government rate.


## 9. Temporary consolidated pay — current Department of Personnel notification

**Notification No. M(164)/42/GEN/DOP dated 12 August 2026**, Department of Personnel, Government of Sikkim. It supersedes Notification No. M(64)/09/GEN/DOP dated 11 April 2018 and takes effect immediately.

- Official PDF: https://dop.sikkim.gov.in/notificationdoc/M(164).pdf
- Group C/D equivalent-grade-pay consolidated pay: ₹18,000 (₹3,800 / ₹4,200), ₹15,000 (₹3,400), ₹12,000 (₹3,000), ₹10,500 (₹2,600), and ₹9,000 (₹2,200) per month.
- The notification separately lists 16 specific posts with individual monthly consolidated amounts. Those rows are transcribed into `src/lib/temporary-pay.ts` and tested.
- Temporary drivers are paid on a daily-wage basis at the rate prescribed by the Labour Department. The notification does not state a daily amount; the calculator therefore requires a manual daily rate and payable days rather than inventing one.
- The notification does not authorize adding regular pay-matrix DA, HRA, SBCA or pension contributions to consolidated pay. The temporary-pay tool displays the prescribed consolidated amount only; deductions and other service conditions remain outside this increment.

## 10. Direct-recruit training allowance and regularisation transition — 25 July 2024

**Notification No. J(1)/86-GEN/DOP (part)** amends Rule 26 of the Sikkim Government Service Rules, 1974. **Notification No. J(1)/87/GEN/DOP (part)** sets a specific transition for certain temporary employees regularised after completing 8 or 4 years of service as on 31 December 2023.

- Training-rule amendment: https://dop.sikkim.gov.in/notificationdoc/J(1)86-GEN-DOP%20(Direct).pdf
- Regularisation transition: https://dop.sikkim.gov.in/notificationdoc/J(1)87-GEN-DOP(Regularisation).pdf
- First-year direct-recruit training allowance: Group D ₹10,000 within Sikkim / ₹18,000 outside; Group C ₹12,000 / ₹20,000; Group B ₹18,000 / ₹25,000.
- For the specified regularised cohort, the 2024 transition states previous temporary consolidated pay for the first year from the regularisation effective date, Level 1/2/3 placement for the next four years, and pay regulation after five years under Notification No. 99/GEN/DOP dated 6 February 2020.
- **Scope limitation:** This is not a general entitlement or a full pay-fixation engine. The 2020 regulation notification and subsequent 2025/2026 orders have not yet been reconciled into a complete eligibility algorithm. The app shows the 2024 provision as guidance only and does not automatically determine regularisation eligibility, level, cell or pay-fixation date.


## 11. GPF contribution planner — Sikkim GPF Rules, 1984

**General Provident Fund (Sikkim Services) Rules, 1984**, Notification No. **8/Fin dated 16 October 1984**, effective **1 January 1985**.

- Official Finance Department rules page: http://www.sikkimfred.gov.in/user/Rules_1984.aspx
- The Rules prescribe a minimum subscription of 6% and a maximum of 100% of the applicable pay/emoluments, with the reference pay determined under the Rules by reference to 31 March preceding the subscription year.

**Calculator treatment:** the GPF planner asks the user to enter the reference pay confirmed by Accounts/DDO and a subscription percentage from 6% to 100%. It displays monthly and twelve-month totals. It does not infer GPF membership, hardcode a current interest rate, or calculate balances, advances, withdrawals or retirement settlement.
