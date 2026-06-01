// ISO currency catalogue used by Onboarding → Currency picker and Settings →
// Preferences. Sorted: INR + USD first, alphabetical thereafter.

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const SEED_CURRENCIES: ReadonlyArray<CurrencyInfo> = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2 },
];
