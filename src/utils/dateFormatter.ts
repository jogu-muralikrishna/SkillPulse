/**
 * Date and Period formatting utilities for user-friendly labor-market intelligence.
 * Eliminates confusing "2023-Q1" codes for ordinary users and presents clear
 * human-readable dates like "Jan 2023", "Apr 2024", "Jan 2026", "Jul 2026".
 */

export function formatPeriodToHuman(period: string, includeQuarterCode: boolean = false): string {
  if (!period) return '';

  // Check for YYYY-QX pattern (e.g. 2024-Q1, 2026-Q3)
  const quarterMatch = period.match(/^(\d{4})-Q([1-4])$/i);
  if (quarterMatch) {
    const year = quarterMatch[1];
    const quarter = parseInt(quarterMatch[2], 10);

    const quarterMonths: Record<number, string> = {
      1: 'Jan',
      2: 'Apr',
      3: 'Jul',
      4: 'Oct'
    };

    const month = quarterMonths[quarter] || 'Jan';
    if (includeQuarterCode) {
      return `${month} ${year} (${year}-Q${quarter})`;
    }
    return `${month} ${year}`;
  }

  // Check for pure year (e.g. "2026")
  if (/^\d{4}$/.test(period.trim())) {
    return period.trim();
  }

  // Check for YYYY-MM pattern
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = monthMatch[1];
    const monthNum = parseInt(monthMatch[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[monthNum - 1] || 'Jan';
    return `${month} ${year}`;
  }

  return period;
}

export function formatPeriodYearOnly(period: string): string {
  if (!period) return '';
  const match = period.match(/^(\d{4})/);
  return match ? match[1] : period;
}
