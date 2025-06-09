"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useCurrency } from "@/hooks/use-currency";
import { majorCurrencies } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Sun, Moon, Monitor, DollarSign, Receipt, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { PaymentMethodList } from "./payment-method-list";

export function PreferencesModal() {
  const { theme, setTheme } = useTheme();
  const {
    settings: currencySettings,
    updateSettings: updateCurrencySettings,
    refreshRates,
    loading: currencyLoading,
  } = useCurrency();

  const [activeTab, setActiveTab] = useState("general");

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
          <DialogDescription>
            Customize your application settings and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Finance
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offline Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable offline functionality
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
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
                  Refresh Rates
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Tax Rate</Label>
                  <p className="text-sm text-muted-foreground">
                    Set default tax rate for invoices
                  </p>
                </div>
                <Select defaultValue="0">
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
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Payment Methods</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage your payment methods for expenses and income
                  </p>
                </div>
              </div>
              <PaymentMethodList />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about upcoming payments
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Invoice Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new invoices
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Expense Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get alerts for unusual expenses
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 