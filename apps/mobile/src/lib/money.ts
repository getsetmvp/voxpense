// Money formatting helpers — lifted from MVP. Standalone from format.ts
// (which is the older app-wide currency formatter) so Amount component can
// render whole + decimal split for typographic emphasis.

const SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  AED: 'د.إ',
  SAR: '﷼',
  ZAR: 'R',
  BRL: 'R$',
  MXN: 'MX$',
  KRW: '₩',
  IDR: 'Rp',
  THB: '฿',
};

export function symbolOf(code: string): string {
  return SYMBOLS[code] ?? code;
}

export function formatMoney(
  amount: number,
  currency: string,
  opts: { compact?: boolean } = {},
): string {
  const sym = symbolOf(currency);
  const decimals = currency === 'JPY' || currency === 'KRW' ? 0 : 2;
  if (opts.compact && Math.abs(amount) >= 1000) {
    return `${sym}${(amount / 1000).toFixed(1)}k`;
  }
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sym}${formatter.format(amount)}`;
}

export function splitMoney(
  amount: number,
  currency: string,
): { whole: string; decimals: string; symbol: string } {
  const sym = symbolOf(currency);
  const dec = currency === 'JPY' || currency === 'KRW' ? 0 : 2;
  const fixed = amount.toFixed(dec);
  const [whole, decimals] = fixed.split('.');
  const fmt = new Intl.NumberFormat('en-IN').format(Number(whole));
  return { whole: fmt, decimals: decimals ?? '', symbol: sym };
}
