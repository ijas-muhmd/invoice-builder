"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { type UseFormReturn } from "react-hook-form"
import { type InvoiceFormValues } from "./invoice-schema"

interface PartyDetailsProps {
  form: UseFormReturn<InvoiceFormValues>
  type: "from" | "to"
  title: string
}

export function PartyDetails({ form, type, title }: PartyDetailsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name={`${type}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === "from" ? "Business Name" : "Client Name"}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={type === "from" ? "Your Business Name" : "Client Name"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${type}.email`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder={type === "from" ? "your@email.com" : "client@email.com"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${type}.address`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input 
                  placeholder={type === "from" ? "Your Address" : "Client Address"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Card>
  )
}