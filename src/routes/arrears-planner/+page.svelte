<script lang="ts">
  import { onMount } from 'svelte';
  import {
    calculateArrears,
    createArrearsAuditCsv,
    createArrearsCsv,
    getArrearsMonthKeys,
    type ArrearChange,
    type ArrearChangeType,
    type ArrearSalaryUpdate,
    type ArrearsInput
  } from '../../lib/arrears';
  import { DEFAULT_SALARY_INPUT, type SalaryInput } from '../../lib/salary';
  import { buildArrearsStatement, type ArrearsStatementMetadata } from '../../lib/arrears-statement';
  import HistoricalRateEditor from '../../lib/HistoricalRateEditor.svelte';
  import type { HistoricalRateComponent, HistoricalRateEntry } from '../../lib/historical-rates';
  import {
    createArrearsEntryTemplateCsv,
    createArrearsScenario,
    loadArrearsScenario,
    parseArrearsEntryCsv,
    restoreArrearsScenario,
    saveArrearsScenario,
    serializeArrearsScenario,
    ARREARS_SCENARIO_STORAGE_KEY,
    type ArrearsScenario
  } from '../../lib/arrears-storage';

  let startMonth = $state('2026-01');
  let endMonth = $state('2026-11');
  let baseSalary = $state<SalaryInput>({ ...DEFAULT_SALARY_INPUT, daRate: 0 });
  let changes = $state<ArrearChange[]>([]);
  let historicalRateSchedule = $state<HistoricalRateEntry[]>([]);
  let historicalRateComponents = $state<HistoricalRateComponent[]>([]);
  let eventMonth = $state('2026-01');
  let eventType = $state<ArrearChangeType>('da-revision');
  let eventBasicPay = $state('');
  let eventDaRate = $state('');
  let eventDescription = $state('');
  let componentEvent = $state({
    hraEligible: '',
    hraRate: '',
    hraMinimum: '',
    sbcaRate: '',
    transportAllowance: '',
    otherEarnings: '',
    pensionMode: '',
    cpsMembershipConfirmed: '',
    gpfMembershipConfirmed: '',
    gpfReferencePay: '',
    manualPension: '',
    professionalTaxMode: '',
    professionalTaxLevelBand: '',
    manualProfessionalTax: '',
    gis: '',
    stampFee: '',
    otherDeductions: ''
  });
  let actualPaid = $state<Record<string, string>>({});
  let recoveryAmounts = $state<Record<string, string>>({});
  let formError = $state('');
  let storageReady = $state(false);
  let storageBlocked = $state(false);
  let storageStatus = $state('Loading saved draft…');
  // Session-only metadata: deliberately excluded from autosaved drafts and backups.
  let statementMetadata = $state<ArrearsStatementMetadata>({ employeeName: '', employeeId: '', designation: '', department: '', office: '', district: '', payLevel: '', cell: '' });

  function currentInput(): ArrearsInput {
    return {
      startMonth,
      endMonth,
      baseSalary: { ...baseSalary },
      changes: changes.map((change) => ({
        ...change,
        ...(change.salaryUpdates ? { salaryUpdates: { ...change.salaryUpdates } } : {})
      })),
      monthlyRecords: monthlyRecords.map((record) => ({ ...record })),
      historicalRateSchedule: historicalRateSchedule.map((entry) => ({ ...entry })),
      historicalRateComponents: [...historicalRateComponents]
    };
  }

  function applyScenario(scenario: ArrearsScenario) {
    startMonth = scenario.startMonth;
    endMonth = scenario.endMonth;
    baseSalary = { ...scenario.baseSalary };
    historicalRateSchedule = (scenario.historicalRateSchedule ?? []).map((entry) => ({ ...entry }));
    historicalRateComponents = [...(scenario.historicalRateComponents ?? [])];
    changes = scenario.changes.map((change) => ({
      ...change,
      ...(change.salaryUpdates ? { salaryUpdates: { ...change.salaryUpdates } } : {})
    }));
    actualPaid = Object.fromEntries(scenario.monthlyRecords.map((record) => [
      record.month,
      record.actualTakeHome === null ? '' : String(record.actualTakeHome)
    ]));
    recoveryAmounts = Object.fromEntries(scenario.monthlyRecords.map((record) => [
      record.month,
      String(record.recovery)
    ]));
    storageBlocked = false;
  }

  onMount(() => {
    try {
      const existing = window.localStorage.getItem(ARREARS_SCENARIO_STORAGE_KEY);
      const saved = loadArrearsScenario(window.localStorage);
      if (saved) {
        applyScenario(saved);
        storageStatus = 'Restored your last saved arrears draft from this browser.';
      } else if (existing) {
        storageBlocked = true;
        storageStatus = 'A saved draft could not be validated. It has been left untouched; import a valid backup to continue saving.';
      } else {
        storageStatus = 'Your entries will be saved privately in this browser.';
      }
    } catch {
      storageBlocked = true;
      storageStatus = 'Browser storage is unavailable. Use the JSON backup controls to keep a copy.';
    }
    storageReady = true;
  });

  $effect(() => {
    if (!storageReady || storageBlocked) return;
    try {
      saveArrearsScenario(currentInput(), window.localStorage);
      storageStatus = 'Automatically saved in this browser.';
    } catch {
      storageStatus = 'Automatic saving is unavailable. Download a JSON backup to preserve your work.';
    }
  });

  function saveDraft() {
    try {
      saveArrearsScenario(currentInput(), window.localStorage);
      storageBlocked = false;
      storageStatus = 'Draft saved in this browser.';
    } catch (cause) {
      storageStatus = cause instanceof Error ? cause.message : 'Unable to save this draft.';
    }
  }

  function downloadText(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function downloadJsonBackup() {
    try {
      const json = serializeArrearsScenario(createArrearsScenario(currentInput()));
      downloadText('sikkim-arrears-backup-' + startMonth + '-to-' + endMonth + '.json', json, 'application/json');
      storageStatus = 'JSON backup downloaded.';
    } catch (cause) {
      storageStatus = cause instanceof Error ? cause.message : 'Unable to create the JSON backup.';
    }
  }

  async function importJsonBackup(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const scenario = restoreArrearsScenario(await file.text(), window.localStorage);
      applyScenario(scenario);
      storageStatus = 'JSON backup restored successfully.';
      formError = '';
    } catch (cause) {
      storageStatus = cause instanceof Error ? cause.message : 'Unable to restore this JSON backup.';
    } finally {
      input.value = '';
    }
  }

  async function importMonthlyCsv(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const imported = parseArrearsEntryCsv(await file.text(), months);
      const paid = { ...actualPaid };
      const recoveries = { ...recoveryAmounts };
      for (const record of imported) {
        paid[record.month] = record.actualTakeHome === null ? '' : String(record.actualTakeHome);
        recoveries[record.month] = String(record.recovery);
      }
      actualPaid = paid;
      recoveryAmounts = recoveries;
      storageStatus = 'Imported ' + imported.length + ' monthly payslip row(s). Existing rows not included in the file were preserved.';
      formError = '';
    } catch (cause) {
      storageStatus = cause instanceof Error ? cause.message : 'Unable to import this monthly CSV.';
    } finally {
      input.value = '';
    }
  }

  function downloadCsvTemplate() {
    try {
      downloadText(
        'sikkim-arrears-monthly-entry-' + startMonth + '-to-' + endMonth + '.csv',
        createArrearsEntryTemplateCsv(months),
        'text/csv;charset=utf-8'
      );
      storageStatus = 'Monthly payslip-entry CSV template downloaded.';
    } catch (cause) {
      storageStatus = cause instanceof Error ? cause.message : 'Unable to create the CSV template.';
    }
  }

  const months = $derived(getArrearsMonthKeys(startMonth, endMonth));
  const monthlyRecords = $derived(months.map((month) => ({
    month,
    actualTakeHome:
      actualPaid[month] === undefined || actualPaid[month].trim() === ''
        ? null
        : Number(actualPaid[month]),
    recovery:
      recoveryAmounts[month] === undefined || recoveryAmounts[month].trim() === ''
        ? 0
        : Number(recoveryAmounts[month])
  })));
  const result = $derived(calculateArrears({
    startMonth,
    endMonth,
    baseSalary: { ...baseSalary },
    changes,
    monthlyRecords,
    ...(historicalRateComponents.length ? {
      historicalRateSchedule,
      historicalRateComponents
    } : {})
  }));
  const missingPaidMonths = $derived(result.rows.filter((row) => row.actualTakeHome === null).length);
  const printableStatement = $derived(buildArrearsStatement(result, statementMetadata));
  const historicalCoverage = $derived(months.flatMap((month) =>
    historicalRateComponents.map((component) => {
      const matches = historicalRateSchedule.filter((entry) =>
        entry.component === component && entry.effectiveFrom <= month &&
        (entry.effectiveTo === undefined || entry.effectiveTo >= month)
      );
      const label = component === 'daRate' ? 'DA' : component === 'hraRate' ? 'HRA' :
        component === 'sbcaRate' ? 'SBCA' : 'Transport allowance';
      const status = matches.length > 1 ? 'Conflict' :
        matches.length === 0 ? 'Missing' : matches[0].verified ? 'Covered' : 'Unverified';
      return { month, component, label, status, source: matches.length === 1 ? matches[0].sourceReference : '' };
    })
  ));
  const historicalCoverageIssues = $derived(historicalCoverage.filter((item) => item.status !== 'Covered').length);
  const fmt = (value: number | null | undefined) =>
    value === null || value === undefined || !Number.isFinite(value)
      ? '—'
      : new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(Math.round(value));

  function updateActualPaid(month: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    actualPaid = { ...actualPaid, [month]: target.value };
  }

  function updateRecovery(month: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    recoveryAmounts = { ...recoveryAmounts, [month]: target.value };
  }

  function buildComponentUpdate(): ArrearSalaryUpdate {
    const update: ArrearSalaryUpdate = {};
    if (componentEvent.hraEligible !== '') update.hraEligible = componentEvent.hraEligible === 'yes';
    if (componentEvent.hraRate.trim() !== '') update.hraRate = Number(componentEvent.hraRate);
    if (componentEvent.hraMinimum.trim() !== '') update.hraMinimum = Number(componentEvent.hraMinimum);
    if (componentEvent.sbcaRate.trim() !== '') update.sbcaRate = Number(componentEvent.sbcaRate);
    if (componentEvent.transportAllowance.trim() !== '') update.transportAllowance = Number(componentEvent.transportAllowance);
    if (componentEvent.otherEarnings.trim() !== '') update.otherEarnings = Number(componentEvent.otherEarnings);
    if (componentEvent.pensionMode !== '') update.pensionMode = componentEvent.pensionMode as SalaryInput['pensionMode'];
    if (componentEvent.cpsMembershipConfirmed === 'yes') update.cpsMembershipConfirmed = true;
    if (componentEvent.gpfMembershipConfirmed === 'yes') update.gpfMembershipConfirmed = true;
    if (componentEvent.gpfReferencePay.trim() !== '') update.gpfReferencePay = Number(componentEvent.gpfReferencePay);
    if (componentEvent.manualPension.trim() !== '') update.manualPension = Number(componentEvent.manualPension);
    if (componentEvent.professionalTaxMode !== '') update.professionalTaxMode = componentEvent.professionalTaxMode as SalaryInput['professionalTaxMode'];
    if (componentEvent.professionalTaxLevelBand !== '') update.professionalTaxLevelBand = componentEvent.professionalTaxLevelBand as SalaryInput['professionalTaxLevelBand'];
    if (componentEvent.manualProfessionalTax.trim() !== '') update.manualProfessionalTax = Number(componentEvent.manualProfessionalTax);
    if (componentEvent.gis.trim() !== '') update.gis = Number(componentEvent.gis);
    if (componentEvent.stampFee.trim() !== '') update.stampFee = Number(componentEvent.stampFee);
    if (componentEvent.otherDeductions.trim() !== '') update.otherDeductions = Number(componentEvent.otherDeductions);
    return update;
  }

  function addChange() {
    const basicPay = eventBasicPay.trim() === '' ? undefined : Number(eventBasicPay);
    const daRate = eventDaRate.trim() === '' ? undefined : Number(eventDaRate);
    const salaryUpdates = buildComponentUpdate();
    const hasSalaryUpdates = Object.keys(salaryUpdates).length > 0;
    const candidate: ArrearChange = {
      effectiveMonth: eventMonth,
      type: eventType,
      description: eventDescription.trim(),
      ...(basicPay === undefined ? {} : { basicPay }),
      ...(daRate === undefined ? {} : { daRate }),
      ...(hasSalaryUpdates ? { salaryUpdates } : {})
    };

    if (!candidate.description) {
      formError = 'Enter the Government order number, date or a clear reference for this change.';
      return;
    }
    if (eventType === 'da-revision' && daRate === undefined) {
      formError = 'Enter the DA rate prescribed by the applicable order.';
      return;
    }
    if (['annual-increment', 'promotion', 'pay-fixation'].includes(eventType) && basicPay === undefined) {
      formError = 'Enter the new basic pay fixed by the increment / promotion / pay-fixation order.';
      return;
    }
    if (eventType === 'manual-adjustment' && basicPay === undefined && daRate === undefined) {
      formError = 'Enter a new basic pay and/or DA rate for this adjustment.';
      return;
    }
    if (eventType === 'allowance-deduction' && !hasSalaryUpdates) {
      formError = 'Enter at least one allowance or deduction value for this effective month.';
      return;
    }
    if (componentEvent.pensionMode === 'cps' && componentEvent.cpsMembershipConfirmed !== 'yes') {
      formError = 'Confirm CPS membership and the applicable contribution basis for the effective month before adding this change.';
      return;
    }
    if (componentEvent.pensionMode === 'gpf') {
      const gpfReferencePay = Number(componentEvent.gpfReferencePay);
      const manualPension = Number(componentEvent.manualPension);
      if (componentEvent.gpfMembershipConfirmed !== 'yes' || !componentEvent.gpfReferencePay.trim() || !componentEvent.manualPension.trim() || !Number.isFinite(gpfReferencePay) || !Number.isFinite(manualPension) || manualPension < Math.round(gpfReferencePay * 0.06) || manualPension > Math.round(gpfReferencePay)) {
        formError = 'For an effective-dated GPF change, confirm the GPF account, enter the applicable reference pay and monthly subscription within 6%–100% of that reference pay.';
        return;
      }
    }

    changes = [...changes, candidate];
    eventBasicPay = '';
    eventDaRate = '';
    eventDescription = '';
    componentEvent = {
      hraEligible: '', hraRate: '', hraMinimum: '', sbcaRate: '',
      transportAllowance: '', otherEarnings: '', pensionMode: '', cpsMembershipConfirmed: '',
      gpfMembershipConfirmed: '', gpfReferencePay: '', manualPension: '', professionalTaxMode: '', professionalTaxLevelBand: '', manualProfessionalTax: '',
      gis: '', stampFee: '', otherDeductions: ''
    };
    formError = '';
  }

  function componentChangeSummary(change: ArrearChange): string {
    const labels: Record<string, string> = {
      hraEligible: 'HRA eligibility',
      hraRate: 'HRA rate',
      hraMinimum: 'HRA minimum',
      sbcaRate: 'SBCA rate',
      transportAllowance: 'Transport',
      otherEarnings: 'Other earnings',
      pensionMode: 'Pension arrangement',
      cpsMembershipConfirmed: 'CPS membership / basis confirmed',
      gpfMembershipConfirmed: 'GPF account / subscription confirmed',
      gpfReferencePay: 'GPF reference pay',
      manualPension: 'GPF / manual pension',
      professionalTaxMode: 'Professional Tax mode',
      manualProfessionalTax: 'Professional Tax',
      gis: 'GIS',
      stampFee: 'Stamp / fixed fee',
      otherDeductions: 'Other deductions'
    };
    return Object.entries(change.salaryUpdates ?? {}).map(([key, value]) => {
      const display = ['cpsMembershipConfirmed', 'gpfMembershipConfirmed'].includes(key) && value === true
        ? 'Confirmed'
        : typeof value === 'boolean'
          ? value ? 'Eligible' : 'Not eligible'
          : String(value) + (key.endsWith('Rate') ? '%' : '');
      return (labels[key] ?? key) + ': ' + display;
    }).join(' · ') || '—';
  }

  function removeChange(index: number) {
    changes = changes.filter((_, itemIndex) => itemIndex !== index);
  }

  function exportAuditCsv() {
    const filename = 'sikkim-arrears-audit-' + startMonth + '-to-' + endMonth + '.csv';
    downloadText(filename, createArrearsAuditCsv(currentInput(), result), 'text/csv;charset=utf-8');
    formError = '';
  }

  function exportCsv() {
    try {
      const filename = 'sikkim-salary-arrears-' + startMonth + '-to-' + endMonth + '.csv';
      const blob = new Blob([createArrearsCsv(result)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      formError = '';
    } catch (cause) {
      formError = cause instanceof Error ? cause.message : 'Unable to export the arrears statement.';
    }
  }

  function printStatement() {
    window.print();
  }
</script>

<svelte:head>
  <title>Salary Arrears Planner | Sikkim Government Salary Calculator</title>
  <meta name="description" content="Prepare a month-by-month Sikkim Government salary arrears estimate using verified basic pay, DA changes, increments, promotion fixation, actual credited salary and recoveries." />
</svelte:head>

<main data-client-ready={storageReady ? 'true' : 'false'} class="min-h-screen bg-[#f4f6f3] px-4 py-8 text-slate-900 dark:bg-[#0b1411] dark:text-slate-100 sm:px-8">
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="no-print flex flex-wrap items-center justify-between gap-3">
      <a href="/" class="text-sm font-bold text-emerald-800 hover:underline dark:text-emerald-400">← Back to salary calculator</a>
      <div class="flex flex-wrap gap-2 text-sm">
        <a href="/pay-progression" class="rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700">Pay progression</a>
        <a href="/gpf-planner" class="rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700">GPF planner</a>
      </div>
    </div>

    <header>
      <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Sikkim Government employee utility</p>
      <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Salary arrears planner</h1>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Reconstruct revised monthly take-home pay after a DA order, annual increment, promotion or pay-fixation order, compare it with the amount actually credited, and account for additional recoveries.</p>
    </header>

    <section class="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <h2 class="font-extrabold">Read before calculating</h2>
      <ul class="mt-2 list-disc space-y-1 pl-5">
        <li>This is an estimate, not an official pay-fixation or arrears sanction. Enter only DA rates and revised basic pay supported by the applicable signed Government order and the employee's fixation statement.</li>
        <li>The opening basic pay and DA rate are the revised entitlement basis for the first month in the selected period. Each dated change applies from that month onward.</li>
        <li>For increments, promotions and pay fixation, the tool does not decide eligibility or calculate the new basic pay automatically. Enter the basic pay fixed by the competent authority.</li>
        <li>Enter the net take-home amount actually credited for each month. Recovery entered below is an additional recovery from this arrears settlement; do not enter an amount already deducted from the credited salary a second time.</li>
        <li>Periods are limited to 60 months. The planner uses the salary engine's current component rules; it does not reconstruct past rule changes automatically.</li>
      </ul>
    </section>

    <section class="no-print rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">Draft tools</p>
          <h2 class="mt-1 text-xl font-black">Save, restore and import payslip entries</h2>
          <p class="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Your arrears scenario is automatically saved in this browser. Use JSON backups to move a complete scenario between devices, or import monthly actual-pay figures from the CSV template.</p>
        </div>
        <span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Browser-only storage</span>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" onclick={saveDraft} class="rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700">Save draft now</button>
        <button type="button" onclick={downloadJsonBackup} class="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold dark:border-slate-700">Download JSON backup</button>
        <button type="button" onclick={downloadCsvTemplate} disabled={!months.length} class="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold disabled:opacity-40 dark:border-slate-700">Download monthly CSV template</button>
        <label class="cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold dark:border-slate-700">
          Import JSON backup
          <input type="file" accept=".json,application/json" onchange={importJsonBackup} class="mt-1 block max-w-[220px] text-[11px] font-normal" />
        </label>
        <label class="cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold dark:border-slate-700">
          Import monthly CSV
          <input type="file" accept=".csv,text/csv" onchange={importMonthlyCsv} disabled={!months.length} class="mt-1 block max-w-[220px] text-[11px] font-normal" />
        </label>
      </div>
      <p class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400" aria-live="polite">{storageStatus}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Local browser storage is not encrypted. Avoid shared or public devices and keep a separate JSON backup. Imported CSV rows must use the selected month range; duplicate months and negative amounts are rejected.</p>
    </section>

    <HistoricalRateEditor bind:entries={historicalRateSchedule} bind:selected={historicalRateComponents} />

    {#if historicalRateComponents.length}
      <section class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="font-extrabold">Historical rate coverage</h2><p class="mt-1 text-xs text-slate-500">Month-by-month source coverage for selected components.</p></div>
          <span class={historicalCoverageIssues === 0 && result.valid ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800" : "rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900"}>{historicalCoverageIssues === 0 && result.valid ? "Coverage complete" : historicalCoverageIssues + " coverage issue(s)"}</span></div>
        <div class="mt-4 overflow-x-auto"><table class="w-full min-w-[620px] text-left text-xs"><thead><tr class="border-b text-[10px] uppercase tracking-wide text-slate-500"><th class="py-2">Month</th><th>Component</th><th>Status</th><th>Source reference</th></tr></thead>
          <tbody>{#each historicalCoverage as item}<tr class="border-b border-slate-100 dark:border-slate-800"><td class="py-2 font-semibold">{item.month}</td><td>{item.label}</td><td><span class={item.status === "Covered" ? "font-bold text-emerald-700 dark:text-emerald-300" : "font-bold text-amber-700 dark:text-amber-300"}>{item.status}</span></td><td>{item.source || "—"}</td></tr>{/each}</tbody></table></div>
        <p class="mt-3 text-xs text-slate-500">A covered month has exactly one verified matching entry. The calculation engine performs authoritative schedule validation.</p>
      </section>
    {/if}
    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">01 · Period and opening entitlement</p>
          <h2 class="mt-1 text-xl font-black">Select the arrears period</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Set the revised salary components that apply at the beginning of the period.</p>
        </div>
        <span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{months.length || '—'} months</span>
      </div>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <label class="text-sm font-bold">From month
          <input type="month" bind:value={startMonth} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
        <label class="text-sm font-bold">To month
          <input type="month" bind:value={endMonth} min={startMonth} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
      </div>

      <div class="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
        <h3 class="text-base font-extrabold">Opening revised salary components</h3>
        <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Enter the applicable figures for the first month. DA is not pre-filled because its rate must match the employee category and the order's effective date.</p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="text-sm font-bold">Basic pay (₹)
            <input type="number" min="1" step="1" bind:value={baseSalary.basicPay} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">DA rate (%)
            <input type="number" min="0" max="200" step="0.01" bind:value={baseSalary.daRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">HRA rate (%)
            <input type="number" min="0" max="100" step="0.01" bind:value={baseSalary.hraRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">HRA minimum (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.hraMinimum} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">SBCA rate (%)
            <input type="number" min="0" max="100" step="0.01" bind:value={baseSalary.sbcaRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Transport allowance (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.transportAllowance} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Other earnings (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.otherEarnings} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-bold dark:border-slate-700">
            <input type="checkbox" bind:checked={baseSalary.hraEligible} class="size-4" />
            HRA admissible for this employee
          </label>
        </div>
      </div>

      <div class="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
        <h3 class="text-base font-extrabold">Opening deductions and pension arrangement</h3>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="text-sm font-bold">Pension arrangement
            <select value={baseSalary.pensionMode} onchange={(event) => { baseSalary.pensionMode = (event.currentTarget as HTMLSelectElement).value as SalaryInput['pensionMode']; baseSalary.cpsMembershipConfirmed = false; baseSalary.gpfMembershipConfirmed = false; }} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">
              <option value="unselected">Select arrangement</option>
              <option value="cps">CPS / CPF</option>
              <option value="gpf">GPF</option>
              <option value="manual">Other manual pension</option>
              <option value="none">OPS / no employee contribution (where confirmed)</option>
            </select>
          </label>
          {#if baseSalary.pensionMode === 'gpf'}
            <label class="text-sm font-bold">GPF reference pay for subscription year (₹)
              <input type="number" min="1" step="1" bind:value={baseSalary.gpfReferencePay} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
            </label>
            <label class="text-sm font-bold">Monthly GPF subscription (₹)
              <input type="number" min="0" step="1" bind:value={baseSalary.manualPension} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
            </label>
            <label class="col-span-full flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <input type="checkbox" checked={baseSalary.gpfMembershipConfirmed === true} onchange={(event) => (baseSalary.gpfMembershipConfirmed = (event.currentTarget as HTMLInputElement).checked)} class="mt-1 size-4 shrink-0" />
              <span>I verified the employee’s GPF account / membership and subscription authority against the service record and DDO / Accounts confirmation.</span>
            </label>
            <p class="col-span-full text-xs text-slate-500">Monthly subscription must be between 6% and 100% of the rule-defined reference pay for the relevant subscription year. Confirm the reference pay with Accounts / DDO; it is not automatically today's Basic Pay.</p>
          {/if}
          {#if baseSalary.pensionMode === 'cps'}
            <label class="col-span-full flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <input type="checkbox" checked={baseSalary.cpsMembershipConfirmed === true} onchange={(event) => (baseSalary.cpsMembershipConfirmed = (event.currentTarget as HTMLInputElement).checked)} class="mt-1 size-4 shrink-0" />
              <span>I verified this employee’s CPS / CPF membership and applicable contribution basis from the signed pension option / service record and DDO / Accounts confirmation. The 09.02.2024 DOP notification announced OPS restoration for employees appointed on or after 01.04.2006; individual option / implementation status must be checked. <a class="underline" href="https://dop.sikkim.gov.in/notificationdoc/23.pdf" target="_blank" rel="noreferrer">Notification No. 23/GEN/DOP</a>.</span>
            </label>
          {/if}
          <label class="text-sm font-bold">Professional Tax treatment
            <select bind:value={baseSalary.professionalTaxMode} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">
              <option value="unselected">Select treatment</option>
              <option value="auto">Automatic — pay-level band</option>
              <option value="manual">Manual payslip amount</option>
              <option value="none">Not applicable / exempt</option>
            </select>
          </label>
          {#if baseSalary.pensionMode === 'manual'}
            <label class="text-sm font-bold">Monthly other pension (₹)
              <input type="number" min="0" step="1" bind:value={baseSalary.manualPension} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
            </label>
          {/if}
          {#if baseSalary.professionalTaxMode === 'auto'}
            <label class="text-sm font-bold">Professional Tax pay-level band
              <select bind:value={baseSalary.professionalTaxLevelBand} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700"><option value="unselected">Select pay-level band</option><option value="below-level-15">Below Level 15 — ₹150</option><option value="level-15-and-above">Level 15 and above — ₹200</option></select>
            </label>
          {/if}
          {#if baseSalary.professionalTaxMode === 'manual'}
            <label class="text-sm font-bold">Monthly Professional Tax (₹)
              <input type="number" min="0" step="1" bind:value={baseSalary.manualProfessionalTax} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
            </label>
          {/if}
          <label class="text-sm font-bold">GIS (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.gis} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Stamp / fixed fee (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.stampFee} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Other monthly deductions (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.otherDeductions} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
        </div>
        <p class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">CPS / CPF is calculated as 10% of Basic Pay + DA with an equal State matching share only when individual membership and the contribution basis are confirmed. Otherwise the calculator does not calculate CPS. Historical changes to GPF / manual pension, HRA, SBCA, Professional Tax and other entered components can be scheduled below.</p>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">02 · Effective-dated changes</p>
      <h2 class="mt-1 text-xl font-black">Add DA revisions, increments or promotion fixation</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">A change is applied from the selected month onward. Use a separate entry for each order/effective date.</p>

      <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label class="text-sm font-bold">Effective month
          <input type="month" bind:value={eventMonth} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
        <label class="text-sm font-bold">Change type
          <select bind:value={eventType} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">
            <option value="da-revision">DA revision</option>
            <option value="annual-increment">Annual increment</option>
            <option value="promotion">Promotion / upgradation</option>
            <option value="pay-fixation">Pay fixation order</option>
            <option value="manual-adjustment">Basic / DA adjustment</option>
            <option value="allowance-deduction">Allowance / deduction revision</option>
          </select>
        </label>
        <label class="text-sm font-bold">Order / payslip reference
          <input bind:value={eventDescription} maxlength="160" placeholder="Order number and date" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
      </div>

      {#if eventType === 'allowance-deduction'}
        <div class="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <h3 class="font-extrabold">Allowance and deduction changes</h3>
          <p class="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Leave a field unchanged to carry forward its previous value. Enter only items that change from this effective month.</p>
          <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label class="text-sm font-bold">HRA eligibility
              <select bind:value={componentEvent.hraEligible} class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">Unchanged</option><option value="yes">Eligible</option><option value="no">Not eligible</option>
              </select>
            </label>
            <label class="text-sm font-bold">HRA rate (%)
              <input type="number" min="0" max="100" step="0.01" value={componentEvent.hraRate} oninput={(event) => (componentEvent.hraRate = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">HRA minimum (₹)
              <input type="number" min="0" step="1" value={componentEvent.hraMinimum} oninput={(event) => (componentEvent.hraMinimum = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">SBCA rate (%)
              <input type="number" min="0" max="100" step="0.01" value={componentEvent.sbcaRate} oninput={(event) => (componentEvent.sbcaRate = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Transport allowance (₹)
              <input type="number" min="0" step="1" value={componentEvent.transportAllowance} oninput={(event) => (componentEvent.transportAllowance = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Other earnings (₹)
              <input type="number" min="0" step="1" value={componentEvent.otherEarnings} oninput={(event) => (componentEvent.otherEarnings = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Pension arrangement
              <select value={componentEvent.pensionMode} onchange={(event) => { componentEvent.pensionMode = (event.currentTarget as HTMLSelectElement).value; componentEvent.cpsMembershipConfirmed = ''; componentEvent.gpfMembershipConfirmed = ''; }} class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">Unchanged</option><option value="cps">CPS / CPF</option><option value="gpf">GPF</option><option value="manual">Manual pension</option><option value="none">OPS / no employee contribution</option>
              </select>
            </label>
            {#if componentEvent.pensionMode === 'gpf'}
              <label class="text-sm font-bold">GPF reference pay for subscription year (₹)
                <input type="number" min="1" step="1" value={componentEvent.gpfReferencePay} oninput={(event) => (componentEvent.gpfReferencePay = (event.currentTarget as HTMLInputElement).value)} placeholder="Enter Accounts-confirmed reference pay" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
              </label>
              <label class="text-sm font-bold">Monthly GPF subscription (₹)
                <input type="number" min="0" step="1" value={componentEvent.manualPension} oninput={(event) => (componentEvent.manualPension = (event.currentTarget as HTMLInputElement).value)} placeholder="Enter revised subscription" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
              </label>
              <label class="col-span-full flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <input type="checkbox" checked={componentEvent.gpfMembershipConfirmed === 'yes'} onchange={(event) => (componentEvent.gpfMembershipConfirmed = (event.currentTarget as HTMLInputElement).checked ? 'yes' : '')} class="mt-1 size-4 shrink-0" />
                <span>I verified the GPF account and subscription authority for this effective month against the service record and DDO / Accounts confirmation.</span>
              </label>
            {/if}
            {#if componentEvent.pensionMode === 'cps'}
              <label class="col-span-full flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <input type="checkbox" checked={componentEvent.cpsMembershipConfirmed === 'yes'} onchange={(event) => (componentEvent.cpsMembershipConfirmed = (event.currentTarget as HTMLInputElement).checked ? 'yes' : '')} class="mt-1 size-4 shrink-0" />
                <span>I verified CPS / CPF membership and the applicable contribution basis for this effective month against the employee’s service record and DDO / Accounts confirmation.</span>
              </label>
            {/if}
            {#if componentEvent.pensionMode === 'manual'}
              <label class="text-sm font-bold">Monthly other pension (₹)
                <input type="number" min="0" step="1" value={componentEvent.manualPension} oninput={(event) => (componentEvent.manualPension = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
              </label>
            {/if}
            <label class="text-sm font-bold">Professional Tax treatment
              <select bind:value={componentEvent.professionalTaxMode} class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">Unchanged</option><option value="auto">Automatic — pay-level band</option><option value="manual">Manual payslip amount</option><option value="none">Not applicable / exempt</option>
              </select>
            </label>
            {#if componentEvent.professionalTaxMode === 'auto'}
              <label class="text-sm font-bold">Professional Tax pay-level band
                <select bind:value={componentEvent.professionalTaxLevelBand} class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><option value="">Select pay-level band</option><option value="below-level-15">Below Level 15 — ₹150</option><option value="level-15-and-above">Level 15 and above — ₹200</option></select>
              </label>
            {/if}
            <label class="text-sm font-bold">Manual Professional Tax (₹)
              <input type="number" min="0" step="1" value={componentEvent.manualProfessionalTax} oninput={(event) => (componentEvent.manualProfessionalTax = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">GIS (₹)
              <input type="number" min="0" step="1" value={componentEvent.gis} oninput={(event) => (componentEvent.gis = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Stamp / fixed fee (₹)
              <input type="number" min="0" step="1" value={componentEvent.stampFee} oninput={(event) => (componentEvent.stampFee = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Other monthly deductions (₹)
              <input type="number" min="0" step="1" value={componentEvent.otherDeductions} oninput={(event) => (componentEvent.otherDeductions = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
          </div>
        </div>
      {:else}
        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="text-sm font-bold">New basic pay (₹)
            <input type="number" min="1" step="1" value={eventBasicPay} oninput={(event) => (eventBasicPay = (event.currentTarget as HTMLInputElement).value)} placeholder="Leave blank when unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">New DA rate (%)
            <input type="number" min="0" max="200" step="0.01" value={eventDaRate} oninput={(event) => (eventDaRate = (event.currentTarget as HTMLInputElement).value)} placeholder="Leave blank when unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
        </div>
      {/if}
      <button type="button" onclick={addChange} class="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700">Add effective-dated change</button>
      {#if changes.length}
        <div class="mt-5 overflow-x-auto">
          <table class="w-full min-w-[1050px] text-left text-sm">
            <thead><tr class="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700"><th class="py-3">Effective month</th><th>Change</th><th>New basic pay</th><th>New DA</th><th>Component changes</th><th>Order / reference</th><th></th></tr></thead>
            <tbody>
              {#each changes as change, index}
                <tr class="border-b border-slate-100 dark:border-slate-800">
                  <td class="py-3">{change.effectiveMonth}</td>
                  <td>{change.type.replaceAll('-', ' ')}</td>
                  <td>{change.basicPay === undefined ? '—' : fmt(change.basicPay)}</td>
                  <td>{change.daRate === undefined ? '—' : change.daRate + '%'}</td>
                  <td class="max-w-[280px] whitespace-normal text-xs">{componentChangeSummary(change)}</td>
                  <td>{change.description}</td>
                  <td class="text-right"><button type="button" onclick={() => removeChange(index)} class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40">Remove</button></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No effective-dated changes added. The opening basic pay and DA rate will apply to every month.</p>
      {/if}
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">03 · Monthly comparison</p>
          <h2 class="mt-1 text-xl font-black">Enter actual salary credited</h2>
          <p class="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">The revised take-home is calculated for each month. Fill in the net amount actually credited and any additional recovery to be deducted from this arrears settlement.</p>
        </div>
        <div class="no-print flex flex-wrap gap-2">
          <button type="button" onclick={printStatement} disabled={!printableStatement} class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-40 dark:border-slate-700">Print salary / arrears statement</button>
          <button type="button" onclick={exportAuditCsv} class="rounded-lg border border-emerald-800 px-3 py-2 text-xs font-bold text-emerald-900 dark:border-emerald-500 dark:text-emerald-300">Download audit report</button>
          <button type="button" onclick={exportCsv} disabled={!result.valid || !result.complete} class="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Download CSV</button>
        </div>
      </div>

      {#if !result.valid}
        <div role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <p class="font-extrabold">Please correct these inputs:</p>
          <ul class="mt-2 list-disc pl-5">
            {#each result.errors as item}<li>{item}</li>{/each}
          </ul>
        </div>
      {:else}
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Revised take-home total</p><p class="mt-1 text-xl font-black">{fmt(result.totals.revisedTakeHome)}</p></div>
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Actual credited total</p><p class="mt-1 text-xl font-black">{result.complete ? fmt(result.totals.actualTakeHome) : 'Pending'}</p></div>
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Additional recoveries</p><p class="mt-1 text-xl font-black">{fmt(result.totals.recoveries)}</p></div>
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Employer / State CPS share (separate)</p><p class="mt-1 text-xl font-black">{fmt(result.totals.employerCpsContribution)}</p></div>
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"><p class="text-xs text-emerald-800 dark:text-emerald-300">{result.complete ? 'Net arrears / balance' : 'Net arrears estimate'}</p><p class="mt-1 text-xl font-black text-emerald-950 dark:text-emerald-100">{result.complete ? fmt(result.totals.netArrears) : 'Incomplete'}</p></div>
        </div>
        {#if !result.complete}
          <p class="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-300">{missingPaidMonths} month(s) still need the actual net salary credited before a final arrears total or CSV statement can be produced.</p>
        {:else}
          <div class="mt-3 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Positive arrears: <strong>{fmt(result.totals.positiveArrears)}</strong> · Negative balance / possible overpayment: <strong>{fmt(Math.abs(result.totals.negativeBalance))}</strong>. A negative net result is shown rather than silently reduced to zero.
          </div>
        {/if}
      {/if}

      {#if result.rows.length}
        <div class="mt-5 overflow-x-auto">
          <table class="w-full min-w-[2100px] text-left text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th class="py-3">Month</th><th>Basic pay</th><th>DA rate</th><th>DA</th><th>HRA</th><th>SBCA</th><th>Transport</th><th>Other earnings</th><th>Revised gross</th><th>Employee CPS / GPF</th><th>Employer CPS share (separate)</th><th>Professional Tax</th><th>GIS</th><th>Stamp fee</th><th>Other deductions</th><th>Total deductions</th><th>Revised take-home</th><th>Actual net paid (₹)</th><th>Recovery (₹)</th><th>Net difference</th>
              </tr>
            </thead>
            <tbody>
              {#each result.rows as row (row.month)}
                <tr class="border-b border-slate-100 align-middle dark:border-slate-800">
                  <td class="py-3 font-bold">{row.month}</td>
                  <td>{fmt(row.basicPay)}</td>
                  <td>{row.daRate}%</td>
                  <td>{fmt(row.da)}</td>
                  <td>{fmt(row.hra)}</td>
                  <td>{fmt(row.sbca)}</td>
                  <td>{fmt(row.transportAllowance)}</td>
                  <td>{fmt(row.otherEarnings)}</td>
                  <td>{fmt(row.grossEntitlement)}</td>
                  <td>{fmt(row.employeePension)}</td>
                  <td>{fmt(row.employerCpsContribution)}</td>
                  <td>{fmt(row.professionalTax)}</td>
                  <td>{fmt(row.gis)}</td>
                  <td>{fmt(row.stampFee)}</td>
                  <td>{fmt(row.otherDeductions)}</td>
                  <td>{fmt(row.employeeDeductions)}</td>
                  <td class="font-bold">{fmt(row.revisedTakeHome)}</td>
                  <td><input type="number" min="0" step="1" value={actualPaid[row.month] ?? ''} oninput={(event) => updateActualPaid(row.month, event)} aria-label={'Actual net salary credited for ' + row.month} placeholder="Enter credited amount" class="w-36 rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" /></td>
                  <td><input type="number" min="0" step="1" value={recoveryAmounts[row.month] ?? '0'} oninput={(event) => updateRecovery(row.month, event)} aria-label={'Additional recovery for ' + row.month} class="w-28 rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" /></td>
                  <td class="font-bold">{fmt(row.netArrears)}</td>
                </tr>
                {#if row.appliedChanges.length}
                  <tr class="border-b border-slate-100 bg-emerald-50/60 dark:border-slate-800 dark:bg-emerald-950/20"><td colspan="20" class="px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200">Applied from this month: {row.appliedChanges.join(' · ')}</td></tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <section class="no-print rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">04 · Printable statement</p>
      <h2 class="mt-1 text-xl font-black">Employee and office details</h2>
      <p class="mt-1 text-sm text-slate-500">Optional metadata is session-only and is not stored in your arrears draft.</p>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label class="text-sm font-bold">Employee name<input bind:value={statementMetadata.employeeName} class="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-transparent" /></label>
        <label class="text-sm font-bold">Employee ID (optional)<input bind:value={statementMetadata.employeeId} class="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-transparent" /></label>
        <label class="text-sm font-bold">Designation<input bind:value={statementMetadata.designation} class="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-transparent" /></label>
        <label class="text-sm font-bold">Department<input bind:value={statementMetadata.department} class="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-transparent" /></label>
        <label class="text-sm font-bold">Office / establishment<input bind:value={statementMetadata.office} class="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-transparent" /></label>
        <label class="text-sm font-bold">District<input bind:value={statementMetadata.district} class="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-transparent" /></label>
        <label class="text-sm font-bold">Pay level<input bind:value={statementMetadata.payLevel} placeholder="As per pay matrix" class="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-transparent" /></label>
        <label class="text-sm font-bold">Cell / stage<input bind:value={statementMetadata.cell} placeholder="As per pay matrix" class="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-transparent" /></label>
      </div>
      <p class="mt-3 text-xs text-slate-500">Use the browser Print dialog and select Save as PDF. A statement is available only after validation succeeds and actual credited pay is entered for every month.</p>
      {#if !printableStatement}<p class="mt-2 text-sm font-semibold text-amber-800">Complete validation and monthly actual-pay entries to enable the statement. The audit CSV remains available for incomplete scenarios.</p>{:else}<p class="mt-2 text-sm font-semibold text-emerald-800">Ready for print preview. Verify all figures and source orders before submission.</p>{/if}
    </section>
    {#if printableStatement}
      <section class="print-statement rounded-2xl border border-slate-300 bg-white p-6 text-slate-950">
        <header class="border-b-2 border-slate-800 pb-4 text-center">
          <p class="text-xs font-bold uppercase tracking-widest">Sikkim Government · Employee salary calculation</p>
          <h2 class="mt-2 text-2xl font-black">Salary / Arrears Calculation Statement</h2>
          <p class="mt-1 text-xs">Draft for verification · {startMonth} to {endMonth}</p>
        </header>
        <div class="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <p><strong>Employee:</strong> {statementMetadata.employeeName || 'Not provided'}</p><p><strong>Employee ID:</strong> {statementMetadata.employeeId || 'Not provided'}</p>
          <p><strong>Designation:</strong> {statementMetadata.designation || 'Not provided'}</p><p><strong>Department:</strong> {statementMetadata.department || 'Not provided'}</p>
          <p><strong>Office:</strong> {statementMetadata.office || 'Not provided'}</p><p><strong>District:</strong> {statementMetadata.district || 'Not provided'}</p>
          <p><strong>Pay level:</strong> {statementMetadata.payLevel || 'Not provided'}</p><p><strong>Cell / stage:</strong> {statementMetadata.cell || 'Not provided'}</p>
        </div>
        <div class="mt-5 overflow-x-auto"><table class="w-full min-w-[1100px] border-collapse text-xs">
          <thead><tr class="border-y border-slate-400 text-left"><th class="py-2">Month</th><th>Basic</th><th>DA</th><th>HRA</th><th>SBCA</th><th>Transport</th><th>Other</th><th>Gross</th><th>Employee deductions</th><th>Employer CPS share (separate)</th><th>Revised net</th><th>Actual paid</th><th>Recovery</th><th>Difference</th></tr></thead>
          <tbody>{#each printableStatement.rows as row}<tr class="border-b border-slate-200"><td class="py-2">{row.month}</td><td>{fmt(row.basicPay)}</td><td>{fmt(row.da)}</td><td>{fmt(row.hra)}</td><td>{fmt(row.sbca)}</td><td>{fmt(row.transportAllowance)}</td><td>{fmt(row.otherEarnings)}</td><td>{fmt(row.grossEntitlement)}</td><td>{fmt(row.employeeDeductions)}</td><td>{fmt(row.employerCpsContribution)}</td><td>{fmt(row.revisedTakeHome)}</td><td>{fmt(row.actualTakeHome)}</td><td>{fmt(row.recovery)}</td><td>{fmt(row.netArrears)}</td></tr>{/each}</tbody>
        </table></div>
        <div class="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <p><strong>Revised gross</strong><br />{fmt(printableStatement.totals.grossEntitlement)}</p><p><strong>Employee deductions</strong><br />{fmt(printableStatement.totals.employeeDeductions)}</p><p><strong>Employer / State CPS share (separate)</strong><br />{fmt(printableStatement.totals.employerCpsContribution)}</p>
          <p><strong>Revised take-home</strong><br />{fmt(printableStatement.totals.revisedTakeHome)}</p><p><strong>Actual credited</strong><br />{fmt(printableStatement.totals.actualTakeHome)}</p>
          <p><strong>Additional recoveries</strong><br />{fmt(printableStatement.totals.recoveries)}</p><p><strong>Positive arrears</strong><br />{fmt(printableStatement.totals.positiveArrears)}</p>
          <p><strong>Negative balance</strong><br />{fmt(Math.abs(printableStatement.totals.negativeBalance))}</p><p><strong>Net arrears / balance</strong><br /><strong>{fmt(printableStatement.totals.netArrears)}</strong></p>
        </div>
        <div class="mt-4 border-t pt-3 text-xs"><strong>Applied changes / order references</strong><ul class="mt-1 list-disc pl-5">{#each printableStatement.appliedChanges as ref}<li>{ref}</li>{:else}<li>No effective-dated change reference entered.</li>{/each}</ul></div>
        <p class="mt-4 border border-amber-500 bg-amber-50 p-3 text-xs font-semibold">This is a draft calculation from user-entered inputs, not an official pay certificate, pay-fixation approval or arrears sanction. Verify service records, applicable orders, eligibility, payslips, deductions and rounding with DDO / Accounts before payment or submission.</p>
        <div class="mt-8 grid grid-cols-2 gap-10 text-xs">
          <div class="border-t border-slate-500 pt-2"><strong>Employee declaration</strong><p class="mt-1">I have checked the details and supporting records entered above.</p><p class="mt-8">Signature: ____________________</p><p class="mt-2">Date: ________________________</p></div>
          <div class="border-t border-slate-500 pt-2"><strong>DDO / Accounts verification</strong><p class="mt-1">Verified with relevant service, order and payroll records.</p><p class="mt-8">Name / designation: ___________</p><p class="mt-2">Signature / seal: ______________</p><p class="mt-2">Date: ________________________</p></div>
        </div>
      </section>
    {:else}
      <section class="print-statement rounded-2xl border border-amber-300 bg-white p-6 text-slate-950">
        <header class="border-b-2 border-slate-800 pb-4 text-center">
          <p class="text-xs font-bold uppercase tracking-widest">Sikkim Government · Employee salary calculation</p>
          <h2 class="mt-2 text-2xl font-black">Salary / Arrears Statement — Withheld</h2>
          <p class="mt-1 text-xs">Draft status · Not ready for calculation or submission</p>
        </header>
        <div class="mt-5 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>No printable arrears statement is available.</strong>
          <p class="mt-2">Complete the salary and historical-rate validation, enter actual credited take-home pay for every month in the selected period, and resolve all validation issues before generating the official-looking draft statement.</p>
          <p class="mt-2">The audit CSV remains available for reviewing incomplete or blocked scenarios. This notice is not a pay certificate, arrears calculation, sanction or payment authority.</p>
        </div>
      </section>
    {/if}

    <section class="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 class="font-extrabold">Government references and limitations</h2>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
        <li><a class="font-semibold text-emerald-800 underline dark:text-emerald-400" href="https://www.sikkimfred.gov.in/DA%20Enhancement/Documents/DA%20Circular%202026.pdf" target="_blank" rel="noreferrer">Finance Department DA Circular dated 1 October 2026</a> — verify the employee category, rate and effective date before entering a DA change.</li>
        <li><a class="font-semibold text-emerald-800 underline dark:text-emerald-400" href="https://dop.sikkim.gov.in/circular/6780.pdf" target="_blank" rel="noreferrer">Department of Personnel clarification on EOL and annual increment dates</a> — qualifying service and leave can affect an employee's actual increment date.</li>
        <li><a class="font-semibold text-emerald-800 underline dark:text-emerald-400" href="https://www.sikkim.gov.in/uploads/Gazette/333_20240813.pdf" target="_blank" rel="noreferrer">Sikkim Government Services (Revised Pay) Rules, 2018</a> — use the applicable order and service book for individual fixation.</li>
      </ul>
      <p class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Every dated component change carries forward from its effective month until superseded. The model still does not calculate interest on arrears, income-tax recomputation, leave salary, DA on pre-revised pay, statutory rounding differences beyond the salary engine, or partial-month proration.</p>
    </section>
  </div>
</main>
<style>
@media print {
  @page { size: A4 landscape; margin: 12mm; }
  :global(body) { background: #fff !important; color: #000 !important; }
  .no-print { display: none !important; }
  :global(main > div > *:not(.print-statement)) { display: none !important; }
  main { min-height: 0 !important; padding: 0 !important; background: #fff !important; color: #000 !important; }
  main > div { max-width: none !important; }
  :global(.print-statement) { display: block !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; break-inside: auto !important; }
  :global(.print-statement tr) { break-inside: avoid; }
  :global(.print-statement thead) { display: table-header-group; }
  :global(.print-statement th), :global(.print-statement td) { vertical-align: top; }
  .print-statement table { min-width: 0 !important; width: 100% !important; font-size: 7pt !important; }
  .print-statement th, .print-statement td { padding: 2px 3px !important; }
  .print-statement p, .print-statement li { color: #000 !important; }
}
</style>
