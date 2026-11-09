# Temporary and regularisation pay audit

Review date: 9 November 2026

## Official notifications reviewed

1. **Notification No. M(164)/42/GEN/DOP dated 12 August 2026**, Department of Personnel, Government of Sikkim: https://dop.sikkim.gov.in/notificationdoc/M(164).pdf
   - Supersedes Notification No. M(64)/09/GEN/DOP dated 11 April 2018.
   - Takes effect immediately.
   - Group C/D equivalent-grade-pay rows and 16 specific-post consolidated-pay rows are transcribed in `src/lib/temporary-pay.ts`.
   - Temporary drivers are paid daily at the rate notified by the Labour Department; no rate is supplied in this notification.

2. **Notification No. J(1)/86-GEN/DOP (part) dated 25 July 2024**, amending Rule 26 of the Sikkim Government Service Rules, 1974: https://dop.sikkim.gov.in/notificationdoc/J(1)86-GEN-DOP%20(Direct).pdf
   - First-year training allowance: Group D ₹10,000 within Sikkim / ₹18,000 outside; Group C ₹12,000 / ₹20,000; Group B ₹18,000 / ₹25,000.

3. **Notification No. J(1)/87/GEN/DOP (part) dated 25 July 2024**, regularisation transition: https://dop.sikkim.gov.in/notificationdoc/J(1)87-GEN-DOP(Regularisation).pdf
   - Applies to the specific employees regularised after completing 8 or 4 years of service as on 31 December 2023.
   - It describes previous temporary consolidated pay for the first year from the regularisation effective date, Level 1/2/3 for the following four years, and pay regulation after five years under Notification No. 99/GEN/DOP dated 6 February 2020.

## Implementation decisions

- Temporary consolidated pay is calculated separately from regular pay-matrix salary.
- No DA, HRA, SBCA or pension contribution is added to the consolidated amount by assumption.
- The 2026 notification's 5 equivalent-grade-pay rows and 16 specific-post rows are implemented as selectable monthly amounts.
- Training allowance rows are available as a separate selection group; users must select the actual training location.
- Temporary driver monthly pay is not invented. The user enters the Labour Department daily rate and payable days.
- The 2024 regularisation transition is explanatory only. No eligibility conclusion or pay-fixation outcome is generated.

## Not yet automated

- Full eligibility criteria and post mapping for every temporary appointment.
- The 2020 Notification No. 99/GEN/DOP pay regulation mechanism and later amendments.
- The 2025/2026 regularisation orders and current cut-off / service conditions.
- Employee-specific regularisation orders, pay-level/cell placement, increments, arrears, deductions, leave and service benefits.
- Labour Department daily-wage rates for temporary drivers.

## Tests

- Five equivalent-grade-pay monthly consolidated rates.
- Sixteen specific-post consolidated rates.
- Six first-year training allowance amounts by group and location.
- Manual driver daily-wage calculation and invalid inputs.
- Unknown category handling.
