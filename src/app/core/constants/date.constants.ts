export const MONTHS: string[] = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MONTHS_SHORT: string[] = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const MONTH_OPTIONS = MONTHS.map((label, i) => ({ value: i + 1, label }));

export const YEARS = [2024, 2025, 2026, 2027];

export function getMonthLabel(year: number, month: number): string {
  return `${MONTHS_SHORT[month - 1]} ${year}`;
}
