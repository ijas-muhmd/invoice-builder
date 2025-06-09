"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { type UseFormReturn } from "react-hook-form"
import { type InvoiceFormValues } from "@/app/invoice-schema"
import { useState, useEffect } from "react"
import { db } from "@/lib/db"

interface InvoiceItemsProps {
  form: UseFormReturn<InvoiceFormValues>
  items: Array<{ id: string; description: string; quantity: number; rate: number }>
  onAddItem: () => void
  onRemoveItem: (index: number) => void
}

interface Headers {
  description: string;
  quantity: string;
  rate: string;
  amount: string;
}

export function InvoiceItems({ form, items, onAddItem, onRemoveItem }: InvoiceItemsProps) {
  const [mounted, setMounted] = useState(false);
  const [headers, setHeaders] = useState<Headers>({
    description: form.watch('itemLabels.description') || "DESCRIPTION",
    quantity: form.watch('itemLabels.quantity') || "QTY",
    rate: form.watch('itemLabels.price') || "PRICE",
    amount: form.watch('itemLabels.amount') || "AMOUNT"
  });

  const [editingHeader, setEditingHeader] = useState<keyof Headers | null>(null);

  // Load saved headers after mount
  useEffect(() => {
    const loadHeaders = async () => {
    setMounted(true);
      const savedHeaders = await db.get('settings', 'invoice-headers');
    if (savedHeaders) {
        setHeaders(savedHeaders);
    }
    };
    loadHeaders();
  }, []);

  // Save headers to IndexedDB when they change
  useEffect(() => {
    const saveHeaders = async () => {
    if (mounted) {
        await db.set('settings', 'invoice-headers', headers);
    }
    };
    saveHeaders();
  }, [headers, mounted]);

  const calculateSubtotal = () => {
    return items.reduce((sum, item, index) => {
      const quantity = form.watch(`items.${index}.quantity`) || 0
      const rate = form.watch(`items.${index}.rate`) || 0
      return sum + (quantity * rate)
    }, 0)
  }

  const currency = form.watch('currency')
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">
              <div className="flex items-center gap-2">
                <span>{headers.description}</span>
              </div>
            </TableHead>
            <TableHead className="w-[15%]">
              <div className="flex items-center gap-2">
                <span>{headers.quantity}</span>
              </div>
            </TableHead>
            <TableHead className="w-[20%]">
              <div className="flex items-center gap-2">
                <span>{headers.rate}</span>
              </div>
            </TableHead>
            <TableHead className="text-right w-[15%]">
              <div className="flex items-center justify-end gap-2">
                <span>{headers.amount}</span>
              </div>
            </TableHead>
            <TableHead className="w-[10%]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Item description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          className="w-24"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name={`items.${index}.rate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-32"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="text-right">
                {currencySymbol}{((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.rate`) || 0)).toFixed(2)}
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
          </div>
          <FormField
            control={form.control}
            name="tax"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="text-sm">Tax (%):</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-32"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shipping"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="text-sm">Shipping:</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-32"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="text-sm">Discount:</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-32"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amountPaid"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="text-sm">Amount Paid:</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-32"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Card>
  )
} 