"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { InvoiceHeader } from "./invoice-form/invoice-header"
import { InvoiceItems } from "./invoice-form/invoice-items"
import { InvoiceNotes } from "./invoice-form/invoice-notes"
import { PartyDetails } from "./invoice-form/party-details"
import { invoiceSchema, type InvoiceFormValues, defaultValues } from "./invoice-form/invoice-schema"

export function InvoiceBuilder() {
  const { toast } = useToast()
  const [items, setItems] = useState([{ description: "", hours: 1, rate: 0 }])

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues,
  })

  function onSubmit(data: InvoiceFormValues) {
    const total = data.items.reduce((sum, item) => sum + (item.hours * item.rate), 0)
    const finalTotal = total * (1 + data.tax / 100) + data.shipping - data.discount
    
    toast({
      title: "Invoice Generated!",
      description: `Total amount: €${finalTotal.toFixed(2)}`,
    })

    // In a real app, we would generate a PDF here
    console.log(data)
  }

  const addItem = () => {
    setItems([...items, { description: "", hours: 1, rate: 0 }])
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <InvoiceHeader form={form} />
        
        <div className="grid md:grid-cols-2 gap-8">
          <PartyDetails form={form} type="from" title="From" />
          <PartyDetails form={form} type="to" title="To" />
        </div>

        <InvoiceItems
          form={form}
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />

        <InvoiceNotes form={form} />

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            <Download className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
        </div>
      </form>
    </Form>
  )
}