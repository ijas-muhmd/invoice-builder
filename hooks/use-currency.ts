'use client';

import { useState, useEffect, useCallback } from 'react';
import { currencyService, CurrencySettings, ConversionResult } from '@/lib/currency-service';

export function useCurrency() {
  const [settings, setSettings] = useState<CurrencySettings | null>(null);
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currencySettings = await currencyService.getSettings();
        setSettings(currencySettings);
        
        const currencies = await currencyService.getSupportedCurrencies();
        setSupportedCurrencies(currencies);
      } catch (err) {
        console.error('Error loading currency settings:', err);
        setError('Failed to load currency settings');
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<CurrencySettings>) => {
    try {
      setLoading(true);
      setError(null);
      
      await currencyService.updateSettings(newSettings);
      const updatedSettings = await currencyService.getSettings();
      setSettings(updatedSettings);
      
      // Refresh supported currencies if base currency changed
      if (newSettings.baseCurrency) {
        const currencies = await currencyService.getSupportedCurrencies();
        setSupportedCurrencies(currencies);
      }
    } catch (err) {
      console.error('Error updating currency settings:', err);
      setError('Failed to update currency settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const convertCurrency = useCallback(async (
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string
  ): Promise<ConversionResult | null> => {
    try {
      setError(null);
      const result = await currencyService.convertCurrency(amount, fromCurrency, toCurrency);
      setLastUpdated(result.lastUpdated);
      return result;
    } catch (err) {
      console.error('Error converting currency:', err);
      setError(`Failed to convert from ${fromCurrency} to ${toCurrency || settings?.baseCurrency}`);
      return null;
    }
  }, [settings?.baseCurrency]);

  const convertToBaseCurrency = useCallback(async (
    amount: number, 
    fromCurrency: string
  ): Promise<number> => {
    try {
      setError(null);
      return await currencyService.convertToBaseCurrency(amount, fromCurrency);
    } catch (err) {
      console.error('Error converting to base currency:', err);
      setError(`Failed to convert ${fromCurrency} to base currency`);
      return amount; // Return original amount as fallback
    }
  }, []);

  const formatCurrency = useCallback((
    amount: number, 
    currency: string, 
    locale?: string
  ): string => {
    return currencyService.formatCurrency(amount, currency, locale);
  }, []);

  const refreshRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { lastUpdated: updated } = await currencyService.getExchangeRates(true);
      setLastUpdated(updated);
    } catch (err) {
      console.error('Error refreshing exchange rates:', err);
      setError('Failed to refresh exchange rates');
    } finally {
      setLoading(false);
    }
  }, []);

  const getDisplayAmount = useCallback((
    amount: number, 
    currency: string, 
    showBoth = false
  ): { 
    original: string; 
    converted?: string; 
    rate?: number;
  } => {
    const original = formatCurrency(amount, currency);
    
    if (!settings?.autoConversion || !showBoth || currency === settings.baseCurrency) {
      return { original };
    }

    // This would need to be implemented with proper async handling
    // For now, return original only
    return { original };
  }, [settings, formatCurrency]);

  return {
    // Settings
    settings,
    updateSettings,
    
    // Currency data
    supportedCurrencies,
    lastUpdated,
    
    // Conversion functions
    convertCurrency,
    convertToBaseCurrency,
    formatCurrency,
    getDisplayAmount,
    
    // Actions
    refreshRates,
    
    // State
    loading,
    error,
    
    // Computed properties
    baseCurrency: settings?.baseCurrency || 'USD',
    autoConversion: settings?.autoConversion || false,
  };
} 