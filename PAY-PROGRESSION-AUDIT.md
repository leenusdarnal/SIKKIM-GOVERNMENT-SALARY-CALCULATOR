# Pay progression and service-history implementation audit

Review date: 9 November 2026

## Implemented in this phase
- Added a helper to read exact basic pay from an existing pay-matrix cell.
- Added an increment scenario that moves cells only after explicit user confirmation of eligibility. It never extrapolates beyond the published final cell.
- Added the two increment-date choices stated in the Sikkim Government Services (Revised Pay) Rules, 2018: 1 January and 1 July.
- Added a local chronological service-history page for appointment, annual increment, promotion, financial upgradation, regularisation and manual correction entries. Each entry is validated against an actual pay-matrix cell.
- Added regression tests for valid/invalid cells, eligibility confirmation, date choices and chronology.

## Official sources reviewed
1. Sikkim Government Services (Revised Pay) Rules, 2018, Notification No. 56/GEN/DOP dated 23 June 2018, effective 1 January 2016: https://www.sikkim.gov.in/uploads/Gazette/333_20240813.pdf.
2. Notification No. 99/GEN/DOP dated 6 February 2020: https://dop.sikkim.gov.in/notificationdoc/99%20GEN%2006.02.2020.pdf. Eligible regularised employees become eligible for the original post pay level after five years of service after regularisation, in accordance with the 11 February 2019 guidelines.
3. Notification No. J(1)/87/GEN/DOP dated 25 July 2024: https://dop.sikkim.gov.in/notificationdoc/J(1)87-GEN-DOP(Regularisation).pdf. Its defined cohort receives prior temporary consolidated pay for year one, Level 1/2/3 for the next four years, then regulation under Notification No. 99/GEN/DOP.
4. Office Memorandum No. 08–10/GEN/DOP dated 3 March 2025 (ACPS): https://dop.sikkim.gov.in/circular/03GENDOP.pdf. It extends ACPS financial upgradation to employees regularised in Levels 1, 2 and 3 from completion of ten years of service from regularisation/appointment, taking into account the restored pay level.
5. Office Memorandum No. 2799/GEN/DOP dated 2 July 2021: https://dop.sikkim.gov.in/circular/2799%20GEN%2002.07.2021.pdf. It concerns temporary employees posted at Sikkim Houses in New Delhi, Kolkata and Guwahati who were granted regular time scale; it states they draw minimum pay of the post and are not entitled to annual increments. This is a narrow cohort-specific restriction.

## Deliberately not automated
- The app does not decide increment eligibility from appointment date alone. Individual service conditions, leave, suspension, training, promotion/upgradation events and applicable orders must be checked.
- No generic initial fixation for direct recruits has been added. Rule 7's 2.57 factor is the 2016 transition into the revised pay structure, not a general current appointment formula.
- No automatic regularisation pay fixation: the 2020 notification relies on 2019 guidelines, and the 2024 transitional cohort plus 2025 ACPS order require individual eligibility verification.
- No generic MACP / Central Government progression. The located 2025 Sikkim memorandum is an ACPS provision for the specified Level 1–3 regularised cohort.
- Promotion fixation and retrospective arrears are not automated in this phase; the 2018 Rules contain separate option-dependent procedures, and retrospective calculations require historical DA/allowance/deduction orders.

This page is a recordkeeping and scenario aid, not an official pay-fixation authority.
