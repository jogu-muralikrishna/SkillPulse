/**
 * Safe number formatting utility to prevent runtime errors like
 * "Cannot read properties of undefined (reading 'toLocaleString')".
 */
export function formatNumber(
  value: number | string | null | undefined,
  fallback: string = '0'
): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    return fallback;
  }
  return num.toLocaleString();
}

export function safeTickFormatter(value: any): string {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString();
}
