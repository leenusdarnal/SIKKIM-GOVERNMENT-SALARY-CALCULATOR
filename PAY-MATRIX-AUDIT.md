# Pay matrix audit — Sikkim Revised Pay Rules, 2018

Audit date: 9 November 2026  
Primary source: Government of Sikkim, Notification No. 56/GEN/DOP dated 23 June 2018, Schedule Part A (Pay Matrix)  
Official Gazette PDF: https://www.sikkim.gov.in/uploads/Gazette/333_20240813.pdf

## Result

The previous calculator incorrectly assumed 40 cells for every level (920 cells). The Gazette Schedule Part A contains **794 printed cells**. Levels 1–14 have 40 cells each; Levels 15–23 have 36, 35, 32, 28, 26, 23, 19, 18 and 17 cells respectively.

The old dataset also had incorrect values in Levels 1, 2, 3, 7, 9 and 10. These have been replaced with the Gazette values.

## Level-by-level reconciliation

| Level | Official cells | Existing values changed or removed |
|---:|---:|---:|
| 1 | 40 | 11 |
| 2 | 40 | 13 |
| 3 | 40 | 19 |
| 4 | 40 | 0 |
| 5 | 40 | 0 |
| 6 | 40 | 0 |
| 7 | 40 | 23 |
| 8 | 40 | 0 |
| 9 | 40 | 13 |
| 10 | 40 | 34 |
| 11 | 40 | 0 |
| 12 | 40 | 0 |
| 13 | 40 | 0 |
| 14 | 40 | 0 |
| 15 | 36 | 4 |
| 16 | 35 | 5 |
| 17 | 32 | 8 |
| 18 | 28 | 12 |
| 19 | 26 | 14 |
| 20 | 23 | 17 |
| 21 | 19 | 21 |
| 22 | 18 | 22 |
| 23 | 17 | 23 |
| **Total** | **794** | **239** |

The removed values are cells that do not exist in the printed schedule; they are not salary amounts that can be selected under the 2018 matrix.

## Data treatment

- The pay-matrix data now follows the Schedule Part A columns and their exact terminal cell counts.
- Level 15 has 36 cells; Level 16 has 35; Levels 17–23 have progressively fewer cells as printed.
- The calculator's cell selector is driven by each level's actual array length, so unavailable cells cannot be selected.
- The UI and README display 794 official cells, not 920 extrapolated entries.
- Tests check all 23 level counts, 794 total cells, strictly increasing values within each level, known correction points, and absence of cells beyond the official terminal cell.

## Important scope note

This audit validates the 2018 Schedule Part A matrix only. It does not decide an employee's substantive level, post-specific Level B upgrade, pay fixation, promotion, or subsequent personal pay protection. Those require the employee's service records and applicable orders. The State Bank-hosted PDF remains an operational reference supplied by the project owner; this full Government Gazette schedule is the controlling matrix source used for the transcription.
