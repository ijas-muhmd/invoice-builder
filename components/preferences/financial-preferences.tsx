"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { majorCurrencies } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { DollarSign, RefreshCw, Calculator, FileText } from "lucide-react";

export function FinancialPreferences() {
  const {
    settings: currencySettings,
    updateSettings: updateCurrencySettings,
    refreshRates,
    loading: currencyLoading,
  } = useCurrency();

  const [defaultTaxRate, setDefaultTaxRate] = useState("0");
  const [autoCalculateTax, setAutoCalculateTax] = useState(true);
  const [roundDecimals, setRoundDecimals] = useState(true);
  const [includePendingInvoices, setIncludePendingInvoices] = useState(() => localStorage.getItem("includePendingInvoices") === "true");
  const [includePaidInvoices, setIncludePaidInvoices] = useState(() => localStorage.getItem("includePaidInvoices") !== "false");

  useEffect(() => {
    localStorage.setItem("includePendingInvoices", includePendingInvoices.toString());
  }, [includePendingInvoices]);
  useEffect(() => {
    localStorage.setItem("includePaidInvoices", includePaidInvoices.toString());
  }, [includePaidInvoices]);

  const handleBaseCurrencyChange = async (value: string) => {
    try {
      await updateCurrencySettings({ baseCurrency: value });
      toast.success("Base currency updated successfully");
    } catch (err) {
      toast.error("Failed to update base currency");
    }
  };

  const handleAutoConversionChange = async (checked: boolean) => {
    try {
      await updateCurrencySettings({ autoConversion: checked });
      toast.success("Auto-conversion setting updated");
    } catch (err) {
      toast.error("Failed to update auto-conversion setting");
    }
  };

  const handleRefreshRates = async () => {
    try {
      await refreshRates();
      toast.success("Exchange rates refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh exchange rates");
    }
  };

  const handleDefaultTaxRateChange = (value: string) => {
    setDefaultTaxRate(value);
    localStorage.setItem("defaultTaxRate", value);
    toast.success("Default tax rate updated");
  };

  const handleAutoCalculateTaxChange = (checked: boolean) => {
    setAutoCalculateTax(checked);
    localStorage.setItem("autoCalculateTax", checked.toString());
    toast.success("Auto-calculate tax setting updated");
  };

  const handleRoundDecimalsChange = (checked: boolean) => {
    setRoundDecimals(checked);
    localStorage.setItem("roundDecimals", checked.toString());
    toast.success("Decimal rounding setting updated");
  };

  return (
    <div className="space-y-6">
      {/* Currency Settings */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure your currency preferences and exchange rates
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Base Currency</Label>
                <p className="text-sm text-muted-foreground">
                  Set your default currency
                </p>
              </div>
              <Select
                value={currencySettings?.baseCurrency}
                onValueChange={handleBaseCurrencyChange}
                disabled={currencyLoading}
              >
                <SelectTrigger className="w-[180px]">
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-convert to Base Currency</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically convert all amounts to your base currency
                </p>
              </div>
              <Switch
                checked={currencySettings?.autoConversion}
                onCheckedChange={handleAutoConversionChange}
                disabled={currencyLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exchange Rates</Label>
                <p className="text-sm text-muted-foreground">
                  Last updated: {currencySettings?.lastUpdated ? new Date(currencySettings.lastUpdated).toLocaleString() : "Never"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRefreshRates}
                disabled={currencyLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${currencyLoading ? 'animate-spin' : ''}`} />
                Refresh Rates
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tax Settings */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Tax Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure tax calculation preferences
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default Tax Rate</Label>
                <p className="text-sm text-muted-foreground">
                  Set default tax rate for invoices
                </p>
              </div>
              <Select
                value={defaultTaxRate}
                onValueChange={handleDefaultTaxRateChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select tax rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-calculate Tax</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically calculate tax on invoice items
                </p>
              </div>
              <Switch
                checked={autoCalculateTax}
                onCheckedChange={handleAutoCalculateTaxChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Round Decimals</Label>
                <p className="text-sm text-muted-foreground">
                  Round amounts to 2 decimal places
                </p>
              </div>
              <Switch
                checked={roundDecimals}
                onCheckedChange={handleRoundDecimalsChange}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Invoice Inclusion Settings */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Inclusion
              </h3>
              <p className="text-sm text-muted-foreground">
                Control whether invoice amounts are included in financial totals
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Pending Invoices</Label>
                <p className="text-sm text-muted-foreground">
                  Add pending invoice amounts to financial totals
                </p>
              </div>
              <Switch
                checked={includePendingInvoices}
                onCheckedChange={(checked) => {
                  setIncludePendingInvoices(checked);
                  toast.success("Pending invoice inclusion updated");
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Paid Invoices</Label>
                <p className="text-sm text-muted-foreground">
                  Add paid invoice amounts to financial totals
                </p>
              </div>
              <Switch
                checked={includePaidInvoices}
                onCheckedChange={(checked) => {
                  setIncludePaidInvoices(checked);
                  toast.success("Paid invoice inclusion updated");
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 