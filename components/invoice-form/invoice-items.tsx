"use client"

import { Plus, Trash2, Pencil } from "lucide-react"
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
import { type InvoiceFormValues } from "./invoice-schema"
import { useEffect, useState } from 'react';

interface InvoiceItemsProps {
  form: UseFormReturn<InvoiceFormValues>
  items: Array<{ description: string; hours: number; rate: number }>
  onAddItem: () => void
  onRemoveItem: (index: number) => void
}

export function InvoiceItems({ form, items, onAddItem, onRemoveItem }: InvoiceItemsProps) {
  // Editable headers state
  const [headers, setHeaders] = useState({
    description: 'Description',
    hours: 'Hours',
    rate: 'Rate',
    amount: 'Amount',
  });
  const [editingHeader, setEditingHeader] = useState<keyof typeof headers | null>(null);

  // Load saved headers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('invoiceHeaders');
    if (saved) setHeaders(JSON.parse(saved));
  }, []);

  // Save headers to localStorage
  useEffect(() => {
    localStorage.setItem('invoiceHeaders', JSON.stringify(headers));
  }, [headers]);

  const handleHeaderClick = (key: keyof typeof headers) => {
    setEditingHeader(key);
  };

  const handleHeaderChange = (key: keyof typeof headers, value: string) => {
    setHeaders(prev => ({ ...prev, [key]: value }));
  };

  const handleHeaderBlur = () => {
    setEditingHeader(null);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.hours * item.rate), 0)
  }

  // Red blinking dot for visual confirmation
  return (
    <div className="relative">
      <div className="absolute top-2 right-2">
        <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
      </div>
      <Card className="p-6">
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
                <div className="flex items-center gap-2 group">
                  {editingHeader === 'description' ? (
                    <Input
                      autoFocus
                      value={headers.description}
                      onChange={e => handleHeaderChange('description', e.target.value)}
                      onBlur={handleHeaderBlur}
                      onKeyDown={e => e.key === 'Enter' && handleHeaderBlur()}
                      className="w-32 text-xs"
                    />
                  ) : (
                    <span
                      className="cursor-pointer group-hover:underline flex items-center"
                      onClick={() => handleHeaderClick('description')}
                    >
                      {headers.description}
                      <Pencil className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </span>
                  )}
                  <span className="ml-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Feature active" />
                </div>
              </TableHead>
              <TableHead className="w-[15%]">
                <div className="flex items-center gap-2">
                  <span>{headers.hours}</span>
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
                    name={`items.${index}.hours`}
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
                  €{((item.hours || 0) * (item.rate || 0)).toFixed(2)}
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
              <span>€{calculateSubtotal().toFixed(2)}</span>
            </div>
            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tax (%):</span>
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
                    <span className="text-sm">Shipping:</span>
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
                    <span className="text-sm">Discount:</span>
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
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>€{(
                  calculateSubtotal() * (1 + (form.watch("tax") || 0) / 100) +
                  (form.watch("shipping") || 0) -
                  (form.watch("discount") || 0)
                ).toFixed(2)}</span>
              </div>
            </div>
            <FormField
              control={form.control}
              name="amountPaid"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Amount Paid:</span>
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
            <div className="flex justify-between font-medium text-primary">
              <span>Balance Due:</span>
              <span>€{(
                calculateSubtotal() * (1 + (form.watch("tax") || 0) / 100) +
                (form.watch("shipping") || 0) -
                (form.watch("discount") || 0) -
                (form.watch("amountPaid") || 0)
              ).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}