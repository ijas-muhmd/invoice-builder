'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { majorCurrencies } from '@/lib/currencies';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyConverter } from './currency-converter';
import { toast } from "sonner";

export function CurrencySettings() {
  const {
    settings,
    updateSettings,
    supportedCurrencies,
    lastUpdated,
    refreshRates,
    loading,
    error,
    baseCurrency,
    autoConversion
  } = useCurrency();

  const [localSettings, setLocalSettings] = useState({
    baseCurrency: baseCurrency,
    autoConversion: autoConversion,
    updateFrequency: settings?.updateFrequency || 'daily'
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleBaseCurrencyChange = async (value: string) => {
    try {
      await updateSettings({ baseCurrency: value });
      toast.success("Base currency updated successfully");
    } catch (err) {
      toast.error("Failed to update base currency");
    }
  };

  const handleAutoConversionChange = async (checked: boolean) => {
    try {
      await updateSettings({ autoConversion: checked });
      toast.success("Auto-conversion setting updated");
    } catch (err) {
      toast.error("Failed to update auto-conversion setting");
    }
  };

  const handleUpdateFrequencyChange = async (frequency: 'manual' | 'hourly' | 'daily') => {
    setLocalSettings(prev => ({ ...prev, updateFrequency: frequency }));
    await updateSettings({ updateFrequency: frequency });
  };

  const handleRefreshRates = async () => {
    try {
      setIsRefreshing(true);
      await refreshRates();
      toast.success("Exchange rates refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh exchange rates");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };

  const getUpdateFrequencyDescription = (frequency: string) => {
    switch (frequency) {
      case 'manual':
        return 'Rates are only updated when you manually refresh';
      case 'hourly':
        return 'Rates are automatically updated every hour';
      case 'daily':
        return 'Rates are automatically updated once per day';
      default:
        return 'Unknown frequency';
    }
  };

  if (!settings) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Base Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span>Base Currency</span>
          </CardTitle>
          <CardDescription>
            Set your primary currency for financial calculations and reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base-currency">Base Currency</Label>
              <Select 
                value={localSettings.baseCurrency} 
                onValueChange={handleBaseCurrencyChange}
                disabled={loading}
              >
                <SelectTrigger id="base-currency">
                  <SelectValue placeholder="Select base currency" />
                </SelectTrigger>
                <SelectContent>
                  {majorCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="text-gray-500">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supported Currencies</Label>
              <div className="text-sm text-gray-600">
                {supportedCurrencies.length} currencies available
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {supportedCurrencies.slice(0, 10).map((currency) => (
                  <Badge key={currency} variant="outline" className="text-xs">
                    {currency}
                  </Badge>
                ))}
                {supportedCurrencies.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{supportedCurrencies.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Conversion Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Conversion</CardTitle>
          <CardDescription>
            Automatically convert multi-currency amounts to your base currency for consolidated reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-conversion">Enable Auto-Conversion</Label>
              <p className="text-sm text-gray-600">
                Show amounts in both original and base currency
              </p>
            </div>
            <Switch
              id="auto-conversion"
              checked={localSettings.autoConversion}
              onCheckedChange={handleAutoConversionChange}
              disabled={loading}
            />
          </div>

          {localSettings.autoConversion && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Multi-currency transactions will be converted to {localSettings.baseCurrency} for consolidated views and analytics.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Exchange Rate Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Exchange Rate Updates</CardTitle>
          <CardDescription>
            Configure how often currency exchange rates are refreshed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="update-frequency">Update Frequency</Label>
              <Select 
                value={localSettings.updateFrequency} 
                onValueChange={handleUpdateFrequencyChange}
                disabled={loading}
              >
                <SelectTrigger id="update-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Only</SelectItem>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                {getUpdateFrequencyDescription(localSettings.updateFrequency)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Last Updated</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {formatLastUpdated(lastUpdated)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshRates}
                  disabled={loading || isRefreshing}
                  className="h-8"
                >
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Exchange Rate API</h4>
                <p className="text-sm text-blue-700 mt-1">
                  We use ExchangeRate-API for reliable, real-time currency conversion data. 
                  Rates are cached for optimal performance and include fallback data for offline use.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Converter Tool */}
      <CurrencyConverter />
    </div>
  );
} 