export type TemporaryPayCategory = 'group-c' | 'group-d' | 'specific-post' | 'training' | 'driver-manual';

export interface TemporaryPayOption {
  id: string;
  label: string;
  amount: number | null;
  category: TemporaryPayCategory;
  note?: string;
}

export const TEMPORARY_PAY_OPTIONS: TemporaryPayOption[] = [
  { id: 'gp-3800', label: 'Equivalent Grade Pay ₹3,800 / ₹4,200 — Inspector, Junior Engineer and equivalent posts', amount: 18_000, category: 'group-c' },
  { id: 'gp-3400', label: 'Equivalent Grade Pay ₹3,400 — Stenographer Grade III, Block Officer, Peshkar, Head Assistant and equivalent posts', amount: 15_000, category: 'group-c' },
  { id: 'gp-3000', label: 'Equivalent Grade Pay ₹3,000 — Computer Operator, Junior Village Administrative Assistant, IT Assistant and equivalent posts', amount: 12_000, category: 'group-c' },
  { id: 'gp-2600', label: 'Equivalent Grade Pay ₹2,600 — LDC, Panchayat Development Assistant, Accounts Clerk, Receptionist and equivalent posts', amount: 10_500, category: 'group-c' },
  { id: 'gp-2200', label: 'Equivalent Grade Pay ₹2,200 — Office Attendant and equivalent Group D posts', amount: 9_000, category: 'group-d' },
  { id: 'consultant-super-specialist', label: 'Consultant (Super Specialist)', amount: 250_000, category: 'specific-post' },
  { id: 'professor-sgmc', label: 'Professor — Sikkim Government Medical College', amount: 250_000, category: 'specific-post' },
  { id: 'associate-professor-sgmc', label: 'Associate Professor — Sikkim Government Medical College', amount: 220_000, category: 'specific-post' },
  { id: 'assistant-professor-sgmc', label: 'Assistant Professor — Sikkim Government Medical College', amount: 180_000, category: 'specific-post' },
  { id: 'specialist', label: 'Specialist', amount: 150_000, category: 'specific-post' },
  { id: 'medical-officer-mbbs', label: 'Medical Officer (Doctor, MBBS)', amount: 55_000, category: 'specific-post' },
  { id: 'medical-officer-ayush', label: 'Medical Officer (Ayush)', amount: 55_000, category: 'specific-post' },
  { id: 'nmc-coordinator', label: 'NMC Coordinator — Sikkim Government Medical College', amount: 55_000, category: 'specific-post' },
  { id: 'dental-surgeon', label: 'Dental Surgeon', amount: 35_000, category: 'specific-post' },
  { id: 'legal-research-officer', label: 'Legal Officer / Research Officer', amount: 35_000, category: 'specific-post' },
  { id: 'assistant-professor-education', label: 'Assistant Professor — Education Department', amount: 30_000, category: 'specific-post' },
  { id: 'lecturer-diet', label: 'Lecturer — DIET', amount: 27_000, category: 'specific-post' },
  { id: 'post-graduate-teacher', label: 'Post Graduate Teacher — Education Department', amount: 25_000, category: 'specific-post' },
  { id: 'assistant-architect-engineer', label: 'Assistant Architect / Assistant Engineer', amount: 25_000, category: 'specific-post' },
  { id: 'graduate-teacher', label: 'Graduate Teacher — Education Department', amount: 18_000, category: 'specific-post' },
  { id: 'primary-computer-teacher', label: 'Primary Teacher / Computer Teacher — Education Department', amount: 15_000, category: 'specific-post' },
  { id: 'training-group-d-sikkim', label: 'Direct recruit training — Group D, within Sikkim', amount: 10_000, category: 'training' },
  { id: 'training-group-d-outside', label: 'Direct recruit training — Group D, outside Sikkim', amount: 18_000, category: 'training' },
  { id: 'training-group-c-sikkim', label: 'Direct recruit training — Group C, within Sikkim', amount: 12_000, category: 'training' },
  { id: 'training-group-c-outside', label: 'Direct recruit training — Group C, outside Sikkim', amount: 20_000, category: 'training' },
  { id: 'training-group-b-sikkim', label: 'Direct recruit training — Group B, within Sikkim', amount: 18_000, category: 'training' },
  { id: 'training-group-b-outside', label: 'Direct recruit training — Group B, outside Sikkim', amount: 25_000, category: 'training' },
  { id: 'driver-daily-wage', label: 'Driver on temporary post — Labour Department daily wage rate (manual)', amount: null, category: 'driver-manual', note: 'The notification does not state a monthly amount for temporary drivers. Enter the current daily rate from the Labour Department notification and multiply by payable days in the relevant month.' }
];

export function getTemporaryPay(optionId: string, payableDays?: number, dailyRate?: number): number | null {
  const option = TEMPORARY_PAY_OPTIONS.find((item) => item.id === optionId);
  if (!option) return null;
  if (option.category !== 'driver-manual') return option.amount;
  if (!Number.isFinite(payableDays) || !Number.isFinite(dailyRate) || (payableDays ?? 0) < 0 || (dailyRate ?? 0) < 0) return null;
  return Math.round((payableDays ?? 0) * (dailyRate ?? 0));
}
