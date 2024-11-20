"use client"

import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { type UseFormReturn } from "react-hook-form"
import { type InvoiceFormValues } from "./invoice-schema"

interface InvoiceNotesProps {
  form: UseFormReturn<InvoiceFormValues>
}

export function InvoiceNotes({ form }: InvoiceNotesProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or bank details..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms and Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Payment terms, delivery schedule..."
                  className="min-h-[100px]"
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