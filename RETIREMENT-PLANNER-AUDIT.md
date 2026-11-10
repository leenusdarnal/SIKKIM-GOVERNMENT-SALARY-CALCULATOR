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
