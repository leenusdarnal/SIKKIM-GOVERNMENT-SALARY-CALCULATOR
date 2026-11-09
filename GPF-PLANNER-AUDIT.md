# GPF contribution planner — implementation audit

Review date: 9 November 2026

## Implemented
- Standalone GPF contribution illustration page.
- User-entered reference pay and contribution percentage.
- Rule-based 6% minimum and 100% maximum limits.
- Monthly and twelve-month totals, plus visible lower/upper amounts.
- Validation tests for minimum, maximum, intermediate, invalid percentage and missing pay.

## Primary source
**General Provident Fund (Sikkim Services) Rules, 1984**, Notification No. 8/Fin dated 16 October 1984, effective 1 January 1985.
- Official Finance Department rules page: http://www.sikkimfred.gov.in/user/Rules_1984.aspx

The source rule sets the minimum subscription at 6% and the maximum at 100% of the applicable emoluments/pay, with the reference pay for the subscription year determined under the rule with reference to 31 March preceding that year.

## Deliberately not automated
- GPF membership/eligibility is not inferred from appointment date or the salary calculator's pension selection.
- Reference pay is entered manually because the relevant 31 March basis must be checked against the employee's service/pay record and the rule's definitions.
- Current interest rate is not hardcoded; no current rate was conclusively verified for this implementation.
- Interest compounding, balance projection, advance, withdrawal, nomination and retirement settlement are not calculated.
- The twelve-month amount is a simple illustration; actual subscription months and permitted changes can vary.

This is a planning aid, not an official GPF ledger or Accounts/DDO determination.
