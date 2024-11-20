"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useFormContext } from "react-hook-form"
import { type InvoiceFormValues } from "@/app/invoice-schema"

const currencies = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
] as const

export function CurrencySelect() {
  const form = useFormContext<InvoiceFormValues>()

  return (
    <FormField
      control={form.control}
      name="currency"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Currency</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
} 