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
    setMounted(true);
    const savedHeaders = localStorage.getItem('invoice-headers');
    if (savedHeaders) {
      setHeaders(JSON.parse(savedHeaders));
    }
  }, []);

  // Save headers to localStorage when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('invoice-headers', JSON.stringify(headers));
    }
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
    <Card className="p-6 card-elevated">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Items</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">
              {mounted && editingHeader === 'description' ? (
                <Input
                  value={headers.description}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setHeaders(h => ({ ...h, description: newValue }));
                    form.setValue('itemLabels.description', newValue, { shouldDirty: true });
                  }}
                  onBlur={() => setEditingHeader(null)}
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => mounted && setEditingHeader('description')}
                  className="hover:text-primary"
                >
                  {headers.description}
                </button>
              )}
            </TableHead>
            <TableHead>
              {mounted && editingHeader === 'quantity' ? (
                <Input
                  value={headers.quantity}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setHeaders(h => ({ ...h, quantity: newValue }));
                    form.setValue('itemLabels.quantity', newValue, { shouldDirty: true });
                  }}
                  onBlur={() => setEditingHeader(null)}
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => mounted && setEditingHeader('quantity')}
                  className="hover:text-primary"
                >
                  {headers.quantity}
                </button>
              )}
            </TableHead>
            <TableHead>
              {mounted && editingHeader === 'rate' ? (
                <Input
                  value={headers.rate}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setHeaders(h => ({ ...h, rate: newValue }));
                    form.setValue('itemLabels.price', newValue, { shouldDirty: true });
                  }}
                  onBlur={() => setEditingHeader(null)}
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => mounted && setEditingHeader('rate')}
                  className="hover:text-primary"
                >
                  {headers.rate}
                </button>
              )}
            </TableHead>
            <TableHead className="text-right">
              {mounted && editingHeader === 'amount' ? (
                <Input
                  value={headers.amount}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setHeaders(h => ({ ...h, amount: newValue }));
                    form.setValue('itemLabels.amount', newValue, { shouldDirty: true });
                  }}
                  onBlur={() => setEditingHeader(null)}
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => mounted && setEditingHeader('amount')}
                  className="hover:text-primary"
                >
                  {headers.amount}
                </button>
              )}
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
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