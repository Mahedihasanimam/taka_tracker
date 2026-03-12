export const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'BDT', label: 'Bangladeshi Taka' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
] as const;

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]['code'];

export const isSupportedCurrency = (value: string): value is CurrencyCode =>
  CURRENCY_OPTIONS.some((option) => option.code === value);

export const formatCurrency = (amount: number, currency: CurrencyCode): string => {
  const numericAmount = Number(amount) || 0;
  const hasDecimals = Math.abs(numericAmount % 1) > 0;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toLocaleString('en-US')}`;
  }
};

export const getCurrencySymbol = (currency: CurrencyCode): string => {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);

    return parts.find((part) => part.type === 'currency')?.value || currency;
  } catch {
    return currency;
  }
};
