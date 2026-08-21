export function roundMoney(value: number | null | undefined): number | null {
  if (value == null || isNaN(value)) { return value as null; }
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
