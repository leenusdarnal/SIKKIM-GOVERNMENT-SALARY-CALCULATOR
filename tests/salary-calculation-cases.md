# Manual salary-calculation regression cases

These cases check the arithmetic used by the browser calculator. They assume revised-pay basic amounts from the existing Sikkim matrix, DA = 60%, HRA = 12%, SBCA = 8%, HRA eligible, no HRA minimum, no transport/other allowances, CPF/CPS selected, and GIS/stamp/other deductions = ₹0. Professional Tax is automatic.

## Case A — Level 17, Cell 1

- Basic Pay: ₹56,000
- DA (60%): ₹33,600
- HRA (12%): ₹6,720
- SBCA (8%): ₹4,480
- Gross: ₹1,00,800
- Employee CPF/CPS (10% of Basic + DA): ₹8,960
- Professional Tax (above ₹40,000): ₹200
- Total deductions: ₹9,160
- **Net in-hand estimate: ₹91,640**
- State matching CPS contribution: ₹8,960 (shown separately; not deducted from net)

## Case B — Level 1, Cell 1

- Basic Pay: ₹15,200
- DA (60%): ₹9,120
- HRA (12%): ₹1,824
- SBCA (8%): ₹1,216
- Gross: ₹27,360
- Employee CPF/CPS (10% of Basic + DA): ₹2,432
- Professional Tax (₹20,001–₹30,000): ₹125
- Total deductions: ₹2,557
- **Net in-hand estimate: ₹24,803**
- State matching CPS contribution: ₹2,432 (shown separately; not deducted from net)

## Professional Tax boundary checks

| Monthly salary basis | Expected automatic PT |
|---:|---:|
| ₹20,000 | ₹0 |
| ₹20,001 | ₹125 |
| ₹30,000 | ₹125 |
| ₹30,001 | ₹150 |
| ₹40,000 | ₹150 |
| ₹40,001 | ₹200 |

## Optional-behaviour checks

1. Uncheck **Eligible for HRA**: HRA becomes ₹0; all other earnings/deductions remain unchanged except where the gross change crosses a PT slab.
2. Select **GPF** and enter ₹2,000: employee pension deduction becomes ₹2,000; no State matching CPS amount is shown.
3. Select **No pension deduction**: pension deduction and employer matching amount are both ₹0.
4. Set GIS ₹10: net pay decreases by ₹10.
5. Set other deductions ₹5,000: net pay decreases by ₹5,000.
6. Change DA from 60% to 58%: DA and CPF/CPS are recalculated from the selected rate.
7. Set transport allowance to ₹500: gross increases by ₹500; PT is recalculated from the new gross.
8. Enter an appointment date before 1 April 2006 while CPF/CPS is selected: the app should display a coverage warning; select the appropriate scheme after checking the service record.

**Caution:** These are arithmetic checks, not proof of entitlement to any allowance. HRA/SBCA defaults are references; all variable components must match the employee's actual Government order/payslip.
