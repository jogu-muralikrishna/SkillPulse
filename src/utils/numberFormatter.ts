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

/**
 * Formats held-out validation MAPE correctly.
 * If the API returns a decimal ratio (e.g. 0.0463), formats as 4.63%.
 * If the API returns an already-scaled percentage (e.g. 4.63 or 11.1), formats as 4.63% or 11.1%.
 * Strictly avoids displaying 0.0463%.
 */
export function formatHeldOutMAPE(mape: number | null | undefined): string {
  if (mape === null || mape === undefined) return 'N/A';
  const num = typeof mape === 'number' ? mape : Number(mape);
  if (isNaN(num)) return 'N/A';

  // If decimal fraction <= 1.0 (e.g. 0.0463), scale to percentage (4.63)
  const pct = num > 0 && num <= 1.0 ? num * 100 : num;

  // Format with up to 2 decimal places cleanly
  const str = pct.toFixed(2);
  const trimmed = str.endsWith('.00')
    ? str.slice(0, -3) + '.0'
    : str.endsWith('0')
    ? str.slice(0, -1)
    : str;
  return `${trimmed}%`;
}
