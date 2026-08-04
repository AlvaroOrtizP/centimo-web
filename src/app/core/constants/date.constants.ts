export const MONTHS: string[] = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MONTHS_SHORT: string[] = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const MONTH_OPTIONS = MONTHS.map((label, i) => ({ value: i + 1, label }));

export const YEARS = [
  new Date().getFullYear() - 2,
  new Date().getFullYear() - 1,
  new Date().getFullYear(),
  new Date().getFullYear() + 1,
  new Date().getFullYear() + 2,
];

export function getMonthLabel(year: number, month: number): string {
  return `${MONTHS_SHORT[month - 1]} ${year}`;
}

export const PREVIOUS_MONTH: { year: number; month: number } = (() => {
  const now = new Date();
  return now.getMonth() === 0
    ? { year: now.getFullYear() - 1, month: 12 }
    : { year: now.getFullYear(), month: now.getMonth() };
})();
