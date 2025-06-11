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

  // Add support for dynamic columns
  const [customColumns, setCustomColumns] = useState<string[]>([]);

  const handleAddColumn = () => {
    const name = prompt('Enter new column name:');
    if (name && !headers[name]) {
      setHeaders({ ...headers, [name]: name.toUpperCase() });
      setCustomColumns([...customColumns, name]);
      // Add the new field to each item
      items.forEach((item, idx) => {
        if (!(name in item)) {
          form.setValue(`items.${idx}.${name}`, '');
        }
      });
    }
  };

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            {Object.entries(headers).map(([key, value]) => (
              <TableHead key={key} className="w-[15%]">
                <div className="flex items-center gap-2 group relative">
                  {editingHeader === key ? (
                    <Input
                      autoFocus
                      value={value}
                      onChange={e => {
                        setHeaders({ ...headers, [key]: e.target.value });
                        form.setValue(`itemLabels.${key}`, e.target.value, { shouldDirty: true });
                      }}
                      onBlur={() => setEditingHeader(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingHeader(null)}
                      className="w-32 text-xs"
                    />
                  ) : (
                    <span
                      className="cursor-pointer group-hover:underline flex items-center"
                      onClick={() => setEditingHeader(key as keyof Headers)}
                    >
                      {value}
                      <svg className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" /></svg>
                      {/* Delete icon for custom columns, only on hover */}
                      {customColumns.includes(key) && (
                        <button
                          type="button"
                          className="ml-1 opacity-0 group-hover:opacity-80 transition-opacity"
                          onClick={e => {
                            e.stopPropagation();
                            // Remove from headers
                            const newHeaders = { ...headers };
                            delete newHeaders[key];
                            setHeaders(newHeaders);
                            // Remove from customColumns
                            setCustomColumns(customColumns.filter(col => col !== key));
                            // Remove from all items
                            items.forEach((item, idx) => {
                              const newItem = { ...item };
                              delete newItem[key];
                              form.setValue(`items.${idx}`, newItem, { shouldDirty: true });
                            });
                          }}
                          title="Remove column"
                        >
                          <svg className="h-3 w-3 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[5%]">
              <Button type="button" size="icon" variant="ghost" onClick={handleAddColumn} title="Add column">
                <span className="text-lg">+</span>
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              {Object.keys(headers).map((key) => (
                <TableCell key={key}>
                  <FormField
                    control={form.control}
                    name={`items.${index}.${key}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder={headers[key]} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
              ))}
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