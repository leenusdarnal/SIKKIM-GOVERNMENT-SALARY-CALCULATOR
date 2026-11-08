# Source register and verification notes

This file records which calculation inputs are backed by Government of Sikkim material and which remain editable estimates. Source review date: **8 November 2026**.

## 1. Pay matrix — primary Government source

**Sikkim Government Services (Revised Pay) Rules, 2018**, Notification No. **56/GEN/DOP**, dated **23 June 2018**. The Rules state that they are deemed to have come into force on **1 January 2016** and apply to eligible State services/posts (with listed exclusions).

- Official Government of Sikkim Finance Department PDF: https://www.sikkimfred.gov.in/FCD/DOCUMENTS15th_FC/SFTopicNote.pdf
- The app retains its 23 pay levels and cell values. The pay matrix is not generated from a Central Government pay matrix.

## 2. DA — current public report, original circular not linked

Public reporting dated **1 October 2026** says Sikkim revised-pay DA increased from **58% to 60%**, effective **1 January 2026**:

- India Today NE, 1 October 2026: https://www.indiatodayne.in/sikkim/story/sikkim-govt-hikes-da-for-employees-dearness-relief-for-pensioners-1457702-2026-10-01
- Moneycontrol report: https://www.moneycontrol.com/news/india/sikkim-government-hikes-dearness-allowance-for-employees-pensioners-13612345.html

**Verification status:** The signed Sikkim Finance Department circular itself was not located during this implementation. Therefore 60% is the app's reported-rate default, not a claim that the original order has been independently authenticated here. DA remains editable; check the signed order for the salary month and employee category. This app addresses revised-pay matrix employees, not employees continuing on pre-revised pay.

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

**Calculator interpretation for salary/wage earners:** up to ₹20,000 per month — nil; ₹20,001–₹30,000 — ₹125; ₹30,001–₹40,000 — ₹150; above ₹40,000 — ₹200. The published schedule text has inconsistent boundary wording in parts of the extracted table; the slab boundaries implemented here should be checked against the current department circular/order if the employee is at a boundary or has a special exemption. The UI allows manual override or not-applicable selection.

## 5. HRA and SBCA — historical departmental reference only

A Government of Sikkim proactive disclosure by the Directorate of Economics, Statistics, Monitoring and Evaluation records HRA at **12%** and SBCA at **8%** in its remuneration section:

- Official Government of Sikkim disclosure (PDF, page showing remuneration/allowances): https://www.sikkim.gov.in/uploads/DeptUploads/Final_DESME_Proactive_Disclosure_under_Section_4_of_the_RTI_Ac%281%29_20230411.pdf

**Important limitation:** This is a departmental disclosure, not a current State-wide order proving universal entitlement or rates for every employee. These two rates are retained as editable reference defaults only. The app does not assume a ₹3,500 HRA minimum. The HRA-eligibility switch must be turned off where accommodation is provided or HRA is otherwise inadmissible.

## 6. GIS, stamp/fixed fee, transport and other allowances/deductions

No current universal State-wide GIS deduction amount, salary stamp fee, or uniform level-based transport allowance was verified from a primary source during this implementation.

**Calculator treatment:**
- GIS and stamp/fixed fee default to ₹0 and are manually entered from the employee's payslip/order.
- Transport allowance defaults to ₹0 and is manually entered only if admissible.
- Other recurring allowances and deductions, including TDS/income tax and loan recoveries, are optional manual entries.
- No central-government allowance rate is applied automatically to Sikkim State employees.

## 7. Maintenance protocol

When a new Government of Sikkim order is issued, update the rule data only after checking:
1. Issuing department and notification/circular number.
2. Date of issue and effective date (these may differ).
3. Covered employee groups and exclusions.
4. Whether the order applies to revised pay, pre-revised pay, pensioners or specific cadres.
5. Rounding, arrears and recovery rules.
6. A worked salary example against a real redacted payslip or DDO calculation.

Never overwrite the editable reference fields with an unverified news report or a Central Government rate.
