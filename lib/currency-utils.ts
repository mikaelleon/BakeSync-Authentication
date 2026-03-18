/**
 * Currency Utilities
 * Handles currency formatting and symbol display based on user preferences
 */

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  decimalPlaces?: number
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  PHP: {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    decimalPlaces: 2
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimalPlaces: 2
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    decimalPlaces: 2
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimalPlaces: 2
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimalPlaces: 0
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimalPlaces: 2
  }
}

export const DEFAULT_CURRENCY = 'PHP'

/**
 * Get currency info by code
 */
export function getCurrencyInfo(currencyCode: string = DEFAULT_CURRENCY): CurrencyInfo {
  return CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY]
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: {
    showSymbol?: boolean
    showDecimals?: boolean
    locale?: string
  }
): string {
  const currency = getCurrencyInfo(currencyCode)
  const { showSymbol = true, showDecimals = true, locale = 'en-US' } = options || {}

  // Format number with appropriate decimal places
  const decimalPlaces = showDecimals ? (currency.decimalPlaces ?? 2) : 0
  const formattedNumber = amount.toLocaleString(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  })

  if (!showSymbol) {
    return formattedNumber
  }

  // Return formatted currency with symbol
  return `${currency.symbol}${formattedNumber}`
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY): string {
  return getCurrencyInfo(currencyCode).symbol
}

/**
 * Get list of available currencies for selection
 */
export function getAvailableCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCIES)
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string, currencyCode: string = DEFAULT_CURRENCY): number {
  const currency = getCurrencyInfo(currencyCode)
  // Remove currency symbol and any non-numeric characters except decimal point
  const cleaned = currencyString
    .replace(currency.symbol, '')
    .replace(/[^\d.-]/g, '')
    .trim()
  
  return parseFloat(cleaned) || 0
}


