/**
 * Compact number formatter
 * Examples:
 *   formatCompact(17000)     → "17K"
 *   formatCompact(1500000)   → "1.5M"
 *   formatCompact(999)       → "999"
 *   formatCompact(1200000)   → "1.2M"
 *   formatCompact(1234567)   → "1.2M"
 */
export function formatCompact(value: number, decimals = 1): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    const str = v % 1 === 0 ? v.toFixed(0) : v.toFixed(decimals).replace(/\.?0+$/, '');
    return `${sign}${str}M`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    const str = v % 1 === 0 ? v.toFixed(0) : v.toFixed(decimals).replace(/\.?0+$/, '');
    return `${sign}${str}K`;
  }
  return `${sign}${abs.toLocaleString('de-DE')}`;
}

/**
 * Format with $ prefix:
 *   fmtMoney(17000) → "$17K"
 */
export function fmtMoney(value: number): string {
  return `$${formatCompact(value)}`;
}
