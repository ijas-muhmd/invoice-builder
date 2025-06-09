'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowRightLeft, Calculator } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { majorCurrencies } from "@/lib/currencies";
import { toast } from "sonner";

interface CurrencyConverterProps {
  className?: string;
}

export function CurrencyConverter({ className }: CurrencyConverterProps) {
  const {
    settings,
    convertCurrency,
    formatCurrency,
    loading,
    error,
  } = useCurrency();

  const [amount, setAmount] = useState<string>("");
  const [fromCurrency, setFromCurrency] = useState<string>(settings?.baseCurrency || "USD");
  const [toCurrency, setToCurrency] = useState<string>(settings?.baseCurrency || "USD");
  const [result, setResult] = useState<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    convertedAmount: number;
    lastUpdated: string;
  } | null>(null);

  const handleConvert = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const conversion = await convertCurrency(
        Number(amount),
        fromCurrency,
        toCurrency
      );

      if (conversion) {
        setResult(conversion);
      }
    } catch (err) {
      toast.error("Failed to convert currency");
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <span>Currency Converter</span>
        </CardTitle>
        <CardDescription>
          Convert between different currencies using current exchange rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Select
              value={fromCurrency}
              onValueChange={setFromCurrency}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {majorCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} {currency.symbol} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Select
              value={toCurrency}
              onValueChange={setToCurrency}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {majorCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} {currency.symbol} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleSwapCurrencies}
            disabled={loading}
          >
            Swap Currencies
          </Button>
          <Button onClick={handleConvert} disabled={loading}>
            Convert
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 border rounded-lg space-y-2">
            <div className="text-lg font-semibold">
              {formatCurrency(result.amount, result.fromCurrency)} ={" "}
              {formatCurrency(result.convertedAmount, result.toCurrency)}
            </div>
            <div className="text-sm text-muted-foreground">
              Exchange Rate: 1 {result.fromCurrency} = {result.rate.toFixed(4)} {result.toCurrency}
            </div>
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(result.lastUpdated).toLocaleString()}
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 text-center">
          Exchange rates are updated regularly and cached for performance.
          <br />
          Rates may vary slightly from actual bank rates.
        </div>
      </CardContent>
    </Card>
  );
} 