<script lang="ts">
  import { onMount } from 'svelte';
  import { PAY_LEVELS, PAY_MATRIX } from '../../lib/data/pay-matrix';
  import { calculateCellProgression, getIncrementDateOptions, validatePayHistory, type PayHistoryEntry } from '../../lib/pay-progression';
  import {
    createPayHistoryBackup,
    createPayHistoryCsv,
    parsePayHistoryBackup,
    readPayHistory,
    savePayHistory
  } from '../../lib/pay-history-storage';
  let level = $state(17);
  let cell = $state(1);
  let increments = $state(1);
  let eligible = $state(false);
  let effectiveDate = $state('2026-01-01');
  let history = $state<PayHistoryEntry[]>([]);
  let historyReady = $state(false);
  let storageMessage = $state('Checking this browser for saved service history…');
  let backupInput: HTMLInputElement | undefined;
  let event = $state<PayHistoryEntry['event']>('appointment');
  let note = $state('');
  let error = $state('');
  const result = $derived(calculateCellProgression(level, cell, increments, eligible));
  const historyResult = $derived(validatePayHistory(history));
  const fmt = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  onMount(() => {
    const restored = readPayHistory(localStorage);
    history = restored.entries;
    storageMessage = restored.message;
    historyReady = true;
  });

  $effect(() => {
    if (!historyReady) return;
    const saved = savePayHistory(history, localStorage);
    storageMessage = saved.message;
  });

  function downloadFile(content: string, filename: string, mimeType: string) {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportBackup() {
    try {
      const filename = 'sikkim-pay-history-' + new Date().toISOString().slice(0, 10) + '.json';
      downloadFile(createPayHistoryBackup(history), filename, 'application/json;charset=utf-8');
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Unable to create the JSON backup.';
    }
  }

  function exportCsv() {
    try {
      const filename = 'sikkim-pay-history-' + new Date().toISOString().slice(0, 10) + '.csv';
      downloadFile(createPayHistoryCsv(history), filename, 'text/csv;charset=utf-8');
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Unable to export the CSV file.';
    }
  }

  function openBackupPicker() {
    backupInput?.click();
  }

  async function importBackup(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      if (file.size > 1_000_000) {
        error = 'The backup file is too large. Select a JSON backup smaller than 1 MB.';
        return;
      }
      if (history.length > 0 && !window.confirm('Restore this backup and replace the service history currently saved in this browser?')) {
        return;
      }

      const parsed = parsePayHistoryBackup(await file.text());
      if (!parsed.ok) {
        error = parsed.message;
        return;
      }

      history = parsed.entries;
      error = '';
      storageMessage = 'Backup restored. The imported entries are being saved in this browser.';
    } catch {
      error = 'The selected backup could not be read. Please choose a valid JSON backup.';
    } finally {
      input.value = '';
    }
  }

  function clearHistory() {
    if (!window.confirm('Clear all service-history entries saved in this browser? Export a backup first if you may need them later.')) return;
    history = [];
    error = '';
  }

  function addEntry() {
    const candidate = [...history, { effectiveDate, event, level, cell, note: note.trim() || undefined }];
    const checked = validatePayHistory(candidate);
    if (!checked.valid) { error = checked.errors.join(' '); return; }
    history = candidate; error = ''; note = '';
  }
</script>
<svelte:head>
  <title>Pay Progression & Service History | Sikkim Salary Calculator</title>
  <meta name="description" content="Record Sikkim Government employee pay history and review pay-matrix increment scenarios." />
</svelte:head>
<main class="min-h-screen bg-[#f4f6f3] px-4 py-8 text-slate-900 dark:bg-[#0b1411] dark:text-slate-100 sm:px-8">
  <div class="mx-auto max-w-5xl space-y-6">
    <a href="/" class="text-sm font-bold text-emerald-800 hover:underline dark:text-emerald-400">← Back to salary calculator</a>
    <header><p class="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Sikkim Government employee utility</p><h1 class="mt-2 text-3xl font-black tracking-tight">Pay progression & service history</h1><p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Explore pay-matrix cell scenarios and maintain a chronological record of appointment, increments, promotion, financial upgradation and regularisation events.</p></header>
    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <h2 class="text-lg font-extrabold">Pay-cell progression scenario</h2><p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Moves through published cells only. Confirm eligibility and effective date from the applicable order and service book before using the result.</p>
      <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label class="text-sm font-bold">Pay level<select class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" bind:value={level}>{#each PAY_LEVELS as item}<option value={item}>Level {item}</option>{/each}</select></label>
        <label class="text-sm font-bold">Current cell<select class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" bind:value={cell}>{#each PAY_MATRIX[level] as _, i}<option value={i + 1}>Cell {i + 1} — {fmt(PAY_MATRIX[level][i])}</option>{/each}</select></label>
        <label class="text-sm font-bold">Number of increments<input class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" type="number" min="1" max="5" bind:value={increments} /></label>
        <label class="text-sm font-bold">Effective date<select class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" bind:value={effectiveDate}>{#each getIncrementDateOptions(2026) as date}<option value={date}>{date}</option>{/each}</select></label>
      </div>
      <label class="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><input type="checkbox" bind:checked={eligible} class="mt-1" />I have independently confirmed that the employee is eligible for the selected increment(s) under the applicable Sikkim rules and service record.</label>
      <div class="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800 sm:grid-cols-3">
        <div><p class="text-xs text-slate-500">Current basic pay</p><p class="mt-1 text-xl font-black">{fmt(PAY_MATRIX[level][cell - 1] ?? null)}</p></div>
        <div><p class="text-xs text-slate-500">Resulting basic pay</p><p class="mt-1 text-xl font-black">{fmt(result.basicPay)}</p></div>
        <div><p class="text-xs text-slate-500">Resulting cell</p><p class="mt-1 text-xl font-black">{result.nextCell === null ? '—' : 'Cell ' + result.nextCell}</p></div>
      </div>
      <p class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{result.message} The date selector is a record field, not an automated eligibility decision.</p>
    </section>
    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <h2 class="text-lg font-extrabold">Chronological service pay history</h2><p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter the effective pay level and cell from each signed order / service-book entry. Entries are saved in this browser only; they are not uploaded or shared with a payroll system.</p>
      <div class="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{history.length} saved {history.length === 1 ? 'entry' : 'entries'}</p>
          <p class="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300" role="status">{storageMessage}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" onclick={exportBackup} disabled={!history.length} class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Download JSON backup</button>
          <button type="button" onclick={exportCsv} disabled={!history.length} class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Export CSV</button>
          <button type="button" onclick={openBackupPicker} class="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">Restore JSON backup</button>
          <input bind:this={backupInput} type="file" accept=".json,application/json" class="hidden" onchange={importBackup} aria-label="Choose a pay-history JSON backup" />
        </div>
      </div>
      <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label class="text-sm font-bold">Effective date<input type="date" bind:value={effectiveDate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" /></label>
        <label class="text-sm font-bold">Event<select bind:value={event} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700"><option value="appointment">Appointment</option><option value="annual-increment">Annual increment</option><option value="promotion">Promotion</option><option value="financial-upgradation">Financial upgradation</option><option value="regularisation">Regularisation</option><option value="manual-correction">Manual correction</option></select></label>
        <label class="text-sm font-bold">Pay level<select bind:value={level} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">{#each PAY_LEVELS as item}<option value={item}>Level {item}</option>{/each}</select></label>
        <label class="text-sm font-bold">Cell<select bind:value={cell} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">{#each PAY_MATRIX[level] as _, i}<option value={i + 1}>Cell {i + 1}</option>{/each}</select></label>
      </div>
      <label class="mt-4 block text-sm font-bold">Order / service-book reference (optional)<input bind:value={note} placeholder="Order number, date or brief reference" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 font-normal dark:border-slate-700" /></label>
      <button type="button" onclick={addEntry} class="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700">Add history entry</button>
      {#if error}<p role="alert" class="mt-3 text-sm font-semibold text-red-600">{error}</p>{/if}
      {#if history.length}
        <div class="mt-5 overflow-x-auto">
          <table class="w-full min-w-[620px] text-left text-sm">
            <thead><tr class="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700"><th class="py-3">Effective date</th><th>Event</th><th>Pay level</th><th>Basic pay</th><th>Reference</th></tr></thead>
            <tbody>
              {#each historyResult.rows as row}
                <tr class="border-b border-slate-100 dark:border-slate-800"><td class="py-3">{row.effectiveDate}</td><td>{row.event.replaceAll('-', ' ')}</td><td>Level {row.level}, Cell {row.cell}</td><td class="font-bold">{fmt(row.basicPay)}</td><td>{row.note ?? '—'}</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
        <button type="button" onclick={clearHistory} class="mt-4 text-sm font-bold text-red-600 hover:underline">Clear all history</button>
      {:else}
        <p class="mt-5 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No service-history entries yet. Add the first entry above; you can later export a backup or restore it on another device.</p>
      {/if}
    </section>
    <section class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><h2 class="font-extrabold">Important rule limitations</h2><ul class="mt-2 list-disc space-y-1 pl-5">
      <li>The Sikkim Revised Pay Rules, 2018 specify 1 January and 1 July as increment dates. This page does not decide which date applies to an individual or whether qualifying service has been completed.</li>
      <li>Promotion fixation, direct-recruit initial fixation, 2016 option/fitment, regularisation transitions and ACPS financial upgradation require event-specific orders and conditions. They are not calculated automatically here.</li>
      <li>Notification No. 99/GEN/DOP dated 6 February 2020 says eligible regularised employees become eligible for the original post pay level after five years; the 2024 transition and 2025 ACPS memorandum add cohort-specific conditions.</li>
      <li>Office Memorandum No. 2799/GEN/DOP dated 2 July 2021 denies annual increments to the specific temporary employees granted regular time scale at Sikkim Houses in New Delhi, Kolkata and Guwahati. Do not generalise this restriction to all employees.</li>
    </ul></section>
    <footer class="pb-8 text-xs text-slate-500">Independent estimation utility · Verify every fixation with the Department of Personnel / DDO before financial use.</footer>
  </div>
</main>
