export const SALARY_SOURCES = [
  {
    title: 'Sikkim Government Services (Revised Pay) Rules, 2018',
    authority: 'Government of Sikkim, Department of Personnel',
    note: 'Primary basis for the State pay matrix. The 23-level, 40-cell matrix has been preserved during this rewrite.',
    url: 'https://www.sikkimfred.gov.in/FCD/DOCUMENTS15th_FC/SFTopicNote.pdf'
  },
  {
    title: 'Sikkim Government Servants (Contributory Pension) Rules, 2006',
    authority: 'Government of Sikkim, Finance Department',
    note: 'CPS generally applies to eligible appointments on/after 1 April 2006, subject to rule exclusions. Employee contribution and matching State contribution are 10%.',
    url: 'https://www.sikkimfred.gov.in/FCD/Documents/Vol%20III.pdf'
  },
  {
    title: 'Sikkim Professional Rate-of-tax schedule',
    authority: 'Commercial Taxes Division, Government of Sikkim',
    note: 'Official salary-earner schedule; the rate boundaries are cross-checked with the Sikkim CAG audit.',
    url: 'http://www.sikkimtax.gov.in/wp-content/uploads/Professional-Rate-of-tax2.pdf'
  },
  {
    title: 'CAG Sikkim Civil Report 2008 — Chapter IV',
    authority: 'Comptroller and Auditor General of India',
    note: 'Historical Sikkim-specific check of Professional Tax slabs and old HRA references. Old HRA references are not treated as current universal entitlements.',
    url: 'https://www.cag.gov.in/uploads/old_reports/state/Sikkim/2008/Civil/Civil_Sikkim_2008/civil_chap_4.pdf'
  },
  {
    title: 'DA enhancement report — 60% from 1 January 2026',
    authority: 'India Today NE, 1 October 2026',
    note: 'Public reporting of the latest DA change. The signed Sikkim Finance Department circular was not located; verify the rate before official payroll use.',
    url: 'https://www.indiatodayne.in/sikkim/story/sikkim-govt-hikes-da-for-employees-dearness-relief-for-pensioners-1457702-2026-10-01'
  },
  {
    title: 'DESME proactive disclosure under the RTI Act',
    authority: 'Government of Sikkim, Directorate of Economics, Statistics, Monitoring and Evaluation',
    note: 'Departmental disclosure showing 12% HRA and 8% SBCA. It is not proof of universal entitlement; both rates remain editable references.',
    url: 'https://www.sikkim.gov.in/uploads/DeptUploads/Final_DESME_Proactive_Disclosure_under_Section_4_of_the_RTI_Ac%281%29_20230411.pdf'
  }
] as const;
