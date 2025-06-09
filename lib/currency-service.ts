export interface ExchangeRates {
  [currency: string]: number;
}

export interface CurrencySettings {
  baseCurrency: string;
  autoConversion: boolean;
  updateFrequency: 'manual' | 'hourly' | 'daily';
  fallbackRates?: ExchangeRates;
  lastUpdated?: string;
}

export interface ConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  convertedAmount: number;
  lastUpdated: string;
}

class CurrencyService {
  private static instance: CurrencyService;
  private readonly API_BASE = 'https://api.exchangerate-api.com/v4/latest';
  private readonly CACHE_KEY = 'currency-exchange-rates';
  private readonly SETTINGS_KEY = 'currency-settings';
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  async getSettings(): Promise<CurrencySettings> {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.error('Error loading currency settings:', error);
    }

    // Default settings
    return {
      baseCurrency: 'USD',
      autoConversion: true,
      updateFrequency: 'daily',
      fallbackRates: this.getFallbackRates()
    };
  }

  async updateSettings(settings: Partial<CurrencySettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
      
      // If base currency changed, clear cache to force refresh
      if (settings.baseCurrency && settings.baseCurrency !== currentSettings.baseCurrency) {
        localStorage.removeItem(this.CACHE_KEY);
      }
    } catch (error) {
      console.error('Error saving currency settings:', error);
      throw error;
    }
  }

  private async getCachedRates(): Promise<{ rates: ExchangeRates; lastUpdated: string } | null> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();

      // Check if cache is still valid
      if (now.getTime() - lastUpdated.getTime() < this.CACHE_DURATION) {
        return data;
      }
    } catch (error) {
      console.error('Error reading cached rates:', error);
    }
    return null;
  }

  private async setCachedRates(rates: ExchangeRates): Promise<void> {
    try {
      const data = {
        rates,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching rates:', error);
    }
  }

  async getExchangeRates(forceRefresh = false): Promise<{ rates: ExchangeRates; lastUpdated: string }> {
    const settings = await this.getSettings();

    // Try to use cached rates first
    if (!forceRefresh) {
      const cached = await this.getCachedRates();
      if (cached) {
        return cached;
      }
    }

    try {
      // Fetch fresh rates from API
      const response = await fetch(`${this.API_BASE}/${settings.baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.rates) {
        throw new Error('Invalid API response format');
      }

      // Cache the rates
      await this.setCachedRates(data.rates);

      return {
        rates: data.rates,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Fall back to cached rates if available
      const cached = await this.getCachedRates();
      if (cached) {
        console.warn('Using cached exchange rates due to API error');
        return cached;
      }

      // Fall back to hardcoded rates as last resort
      console.warn('Using fallback exchange rates');
      return {
        rates: settings.fallbackRates || this.getFallbackRates(),
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string
  ): Promise<ConversionResult> {
    const settings = await this.getSettings();
    const targetCurrency = toCurrency || settings.baseCurrency;

    // If same currency, return as-is
    if (fromCurrency === targetCurrency) {
      return {
        amount,
        fromCurrency,
        toCurrency: targetCurrency,
        rate: 1,
        convertedAmount: amount,
        lastUpdated: new Date().toISOString()
      };
    }

    const { rates, lastUpdated } = await this.getExchangeRates();

    // Calculate conversion rate
    let rate: number;
    
    if (fromCurrency === settings.baseCurrency) {
      // Converting from base currency
      rate = rates[targetCurrency];
    } else if (targetCurrency === settings.baseCurrency) {
      // Converting to base currency
      rate = 1 / rates[fromCurrency];
    } else {
      // Converting between two non-base currencies
      rate = rates[targetCurrency] / rates[fromCurrency];
    }

    if (!rate || isNaN(rate)) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${targetCurrency}`);
    }

    const convertedAmount = amount * rate;

    return {
      amount,
      fromCurrency,
      toCurrency: targetCurrency,
      rate,
      convertedAmount,
      lastUpdated
    };
  }

  async convertToBaseCurrency(amount: number, fromCurrency: string): Promise<number> {
    const settings = await this.getSettings();
    
    if (fromCurrency === settings.baseCurrency) {
      return amount;
    }

    const conversion = await this.convertCurrency(amount, fromCurrency, settings.baseCurrency);
    return conversion.convertedAmount;
  }

  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const { rates } = await this.getExchangeRates();
      const settings = await this.getSettings();
      
      // Include base currency and all available rates
      const currencies = new Set([settings.baseCurrency, ...Object.keys(rates)]);
      return Array.from(currencies).sort();
    } catch (error) {
      console.error('Error getting supported currencies:', error);
      // Return major currencies as fallback
      return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
    }
  }

  private getFallbackRates(): ExchangeRates {
    // Static fallback rates (relative to USD) - updated periodically
    return {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      CNY: 6.45,
      INR: 74.5,
      BRL: 5.2,
      KRW: 1180.0,
      SGD: 1.35,
      HKD: 7.8,
      MXN: 20.0,
      NOK: 8.5,
      SEK: 8.8,
      NZD: 1.42,
      ZAR: 14.5,
      TRY: 8.5,
      RUB: 73.0,
      PLN: 3.9
    };
  }

  // Utility method to format currency with proper symbols
  formatCurrency(amount: number, currency: string, locale = 'en-US'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback to basic formatting
      const symbol = this.getCurrencySymbol(currency);
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  private getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$',
      CHF: 'Fr', CNY: '¥', INR: '₹', BRL: 'R$', KRW: '₩', SGD: 'S$',
      HKD: 'HK$', MXN: '$', NOK: 'kr', SEK: 'kr', NZD: 'NZ$',
      ZAR: 'R', TRY: '₺', RUB: '₽', PLN: 'zł'
    };
    return symbols[currency] || currency;
  }
}

export const currencyService = CurrencyService.getInstance(); 