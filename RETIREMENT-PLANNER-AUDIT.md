# Retirement benefits estimator — scope and safeguards

## Purpose
This is a configurable illustration worksheet for employee-specific pension, commutation, gratuity and leave-encashment scenarios. It is not a Government pension calculator with preloaded legal entitlements.

## Formula inputs
- Pension: user-entered pensionable emoluments × user-entered pension percentage.
- Commutation: calculated monthly pension × user-entered commutation percentage × user-entered equivalent-month multiplier.
- Gratuity: user-entered gratuity emoluments × service units × multiplier ÷ divisor, capped at the user-entered ceiling.
- Leave encashment: user-entered monthly leave-salary base × certified eligible leave days ÷ user-entered divisor.
- Other one-time benefits: optional manually verified amount.

## Controls
- All fields initialise to zero; no scheme, rate, service unit, multiplier, divisor, ceiling or leave entitlement is presumed.
- Negative, non-finite and out-of-range percentage values are rejected; required divisors and commutation multipliers are validated.
- This module does not decide OPS/CPS/CPF/NPS/GPF membership or cohort eligibility.
- No local persistence or server submission is implemented; values remain in page state for the current session.

## Exclusions
Family pension, tax, interest, deductions, recoveries, survivor benefits, medical benefits, scheme eligibility decisions and official sanction forms are not calculated. Verify all inputs with current signed rules/orders, service book and DDO / Accounts authority.


## Boundary-validation update — 10 November 2026

### Complete-section requirements
- The pension section must contain both positive pensionable emoluments and a positive pension percentage, or remain entirely unused (all zero).
- Commutation must either remain unused (percentage and multiplier both zero) or contain both a positive commutation percentage and a positive multiplier, alongside a valid positive pension estimate.
- Gratuity must either remain unused or include positive emoluments, eligible service units, formula multiplier, divisor and applicable ceiling.
- Leave encashment must either remain unused or include positive monthly leave-salary base, certified leave days and divisor.
- Other one-time benefits remain a separate manually verified amount.

### Invalid-result suppression
- Negative, non-finite and out-of-range percentages are rejected.
- Incomplete benefit sections return an invalid result with all displayed amount fields set to zero. This prevents a partial formula from appearing as a valid estimate next to a warning.
- Derived amounts must remain finite safe whole-rupee integers; overflow or unsafe values invalidate the result and suppress all amounts.
- Commutation is constrained by its 0–100% input range; residual pension cannot become negative.
- Gratuity is capped at the explicitly entered ceiling; no ceiling is assumed.
- Monetary results use nearest-whole-rupee rounding.

### Regression coverage
Tests cover the empty/default state, pension/commutation 0% and 100% boundaries, incomplete pension/commutation/gratuity/leave sections, gratuity below and above ceiling, rounding, negative/non-finite values, arithmetic overflow, and separate other benefits.

### Continuing limitations
This remains a generic employee-specific illustration. The application does not establish scheme membership, qualifying service, a legally permitted commutation percentage, a gratuity ceiling, leave entitlement or the correct formula. DDO / Accounts confirmation and applicable current signed orders remain essential.
