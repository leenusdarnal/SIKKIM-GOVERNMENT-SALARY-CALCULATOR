[object Object]

## Draft persistence and monthly payslip import

- The arrears planner automatically saves its current draft to browser-local storage after the page has restored its initial state. A manual Save control is also available.
- The versioned JSON backup contains the selected period, opening salary inputs, effective-dated changes and each month's actual credited salary / additional recovery.
- JSON restore validates the version, date range, salary field types, change types, effective months, component values, monthly records, duplicate months and a 2 MB size ceiling before replacing the saved draft.
- Incomplete drafts are allowed to be saved. Structural validation is intentionally separate from salary-calculation validation so users do not lose work while filling required salary fields.
- A monthly CSV template contains `month`, `actualTakeHome` and `recovery`. CSV import rejects malformed quoting, duplicate or out-of-period months, negative amounts and files larger than 2 MB. Imported rows replace matching months; months absent from the import retain their existing entries.
- Corrupt or unsupported existing local data is not automatically overwritten on page load. The UI reports the issue and allows the user to import a valid JSON backup.
- Browser local storage is not encrypted and is specific to the browser profile/device. Users should avoid shared/public devices and retain a separate JSON backup. No scenario data is sent to a server.
