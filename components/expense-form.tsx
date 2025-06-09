"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { useFinancial, type Transaction } from "@/contexts/financial-context"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useCustomers } from '@/contexts/customer-context'
import { CustomerForm } from "@/components/customer-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal } from "@/components/ui/dialog"
import { type Customer } from "@/contexts/customer-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { PaymentMethodForm } from "@/components/payment-method-form"
import { Badge } from "@/components/ui/badge"
import { MultiSelect, MultiSelectItem } from "@/components/ui/multi-select"

interface ExpenseFormProps {
  expense?: Transaction | null
  onSuccess: () => void
  onCancel: () => void
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Bank Account':
      return 'bg-blue-100 text-blue-800'
    case 'Credit Card':
      return 'bg-purple-100 text-purple-800'
    case 'Debit Card':
      return 'bg-green-100 text-green-800'
    case 'UPI':
      return 'bg-yellow-100 text-yellow-800'
    case 'PayPal':
      return 'bg-indigo-100 text-indigo-800'
    case 'Cash':
      return 'bg-gray-100 text-gray-800'
    case 'Digital Wallet':
      return 'bg-pink-100 text-pink-800'
    case 'Net Banking':
      return 'bg-orange-100 text-orange-800'
    case 'Other':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  const { addTransaction, updateTransaction, getExpenseCategories, transactions, paymentMethods } = useFinancial()
  const { customers, addCustomer } = useCustomers()
  const { currentWorkspace } = useWorkspace()
  const expenseCategories = getExpenseCategories()
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    currency: "USD",
    category: "",
    date: new Date(),
    description: "",
    vendor: "",
    status: "pending" as Transaction['status'],
    paymentMethodId: ""
  })
  const [conversionRate, setConversionRate] = useState('1')
  const [syncingRate, setSyncingRate] = useState(false)
  const [inrAmountPreview, setInrAmountPreview] = useState('0.00')
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [tags, setTags] = useState<string[]>(expense?.tags || [])

  // Cache for exchange rates
  const exchangeRateCache = useRef<{[key: string]: number}>({})

  useEffect(() => {
    if (expense) {
      setFormData({
        title: expense.title,
        amount: expense.amount.toString(),
        currency: expense.currency,
        category: expense.category,
        date: new Date(expense.date),
        description: expense.description || "",
        vendor: expense.vendor || "",
        status: expense.status,
        paymentMethodId: expense.paymentMethodId || ""
      })
      // Set conversion rate from existing expense if available
      setConversionRate(expense.conversionRate?.toString() || '1')
    }
  }, [expense])

  // Refactored fetch conversion rate function (memoized)
  const fetchConversionRate = useCallback(async (fromCurrency: string) => {
    if (fromCurrency.toLowerCase() === 'inr') return '1'

    const cacheKey = `${fromCurrency.toLowerCase()}-inr`
    if (exchangeRateCache.current[cacheKey]) {
      return exchangeRateCache.current[cacheKey].toString()
    }

    setSyncingRate(true)
    try {
      let url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromCurrency.toLowerCase()}.json`
      let res = await fetch(url)
      if (!res.ok) {
        url = `https://latest.currency-api.pages.dev/v1/currencies/${fromCurrency.toLowerCase()}.json`
        res = await fetch(url)
      }
      if (!res.ok) throw new Error('Failed to fetch rate')
      
      const data = await res.json()
      const rate = data[fromCurrency.toLowerCase()]['inr']
      if (!rate) throw new Error('Rate not found in response')

      exchangeRateCache.current[cacheKey] = rate
      return rate.toString()
    } catch (err) {
      console.error('Error fetching rate:', err)
      return '' // Return empty string on error
    } finally {
      setSyncingRate(false)
    }
  }, [])

  // Automatic fetch for conversion rate when currency changes
  useEffect(() => {
    console.log('Triggering auto-fetch useEffect...', { currency: formData.currency, expense: expense })
    if (formData.currency !== 'INR') {
      const shouldFetch = !expense || (expense.currency !== formData.currency || typeof expense.conversionRate !== 'number')
      console.log('Should fetch?', shouldFetch)
      if (shouldFetch) {
        fetchConversionRate(formData.currency).then(rate => {
          if (rate) {
            console.log('Auto-fetched rate:', rate)
            setConversionRate(rate)
          }
        })
      }
    } else {
      console.log('Currency is INR, setting rate to 1')
      setConversionRate('1')
    }
  }, [formData.currency, fetchConversionRate, expense])

  // Calculate INR preview (memoized)
  const calculatePreview = useCallback(() => {
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount === 0) {
      setInrAmountPreview('0.00')
      return
    }

    if (formData.currency === 'INR') {
      setInrAmountPreview(amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }))
      return
    }

    const rate = parseFloat(conversionRate)
    if (isNaN(rate) || rate === 0) {
      setInrAmountPreview('0.00') // If rate still invalid, show 0
      return
    }

    setInrAmountPreview((amount * rate).toLocaleString('en-IN', { minimumFractionDigits: 2 }))
  }, [formData.amount, formData.currency, conversionRate])

  // Trigger preview calculation when dependencies change
  useEffect(() => {
    calculatePreview()
  }, [calculatePreview])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const rate = formData.currency === 'INR' ? 1 : parseFloat(conversionRate)
    const inrAmount = parseFloat(formData.amount) * rate
    const expenseData = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category: formData.category,
      date: formData.date.toISOString(),
      description: formData.description,
      vendor: formData.vendor,
      status: formData.status,
      paymentMethodId: formData.paymentMethodId,
      conversionRate: rate,
      inrAmount,
      tags,
    }
    if (expense) {
      updateTransaction({
        ...expense,
        ...expenseData,
      })
    } else {
      addTransaction({
        ...expenseData,
        type: 'expense'
      })
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Expense Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Office Supplies"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <div className="flex">
            <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
                <SelectItem value="KRW">KRW - South Korean Won</SelectItem>
                <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="rounded-l-none"
              required
            />
          </div>
          {formData.currency !== 'INR' && inrAmountPreview !== '0.00' && (
            <p className="text-sm text-gray-500 mt-2">Equivalent to: ₹{inrAmountPreview}</p>
          )}
          {formData.currency !== 'INR' && (
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="conversionRate">Conversion Rate to INR *</Label>
                <Button type="button" size="icon" variant="ghost" onClick={() => fetchConversionRate(formData.currency).then(rate => rate && setConversionRate(rate))} disabled={syncingRate}>
                  <RefreshCw className={syncingRate ? 'animate-spin' : ''} />
                </Button>
              </div>
              <Input
                id="conversionRate"
                type="number"
                step="0.0001"
                min="0"
                value={conversionRate}
                onChange={e => setConversionRate(e.target.value)}
                placeholder="e.g. 83.25"
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                Enter the rate for 1 {formData.currency} in INR. You can sync the latest rate or enter manually.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => date && setFormData({ ...formData, date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor">Vendor / Expense Source *</Label>
        <Select
          value={formData.vendor}
          onValueChange={val => {
            const selectedCustomer = customers.find((c: Customer) => c.id === val)
            if (selectedCustomer) {
              setFormData(f => ({
                ...f,
                vendor: `${selectedCustomer.businessName}${selectedCustomer.email ? ` (${selectedCustomer.email})` : ""}`
              }))
            }
          }}
          required
        >
          <SelectTrigger id="vendor">
            <SelectValue placeholder="Select or add vendor/expense source">
              {formData.vendor || "Select a vendor"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {customers.map((cust: Customer) => (
              <SelectItem key={cust.id} value={cust.id}>
                {cust.businessName} {cust.email ? `(${cust.email})` : ""}
              </SelectItem>
            ))}
            <SelectSeparator />
            <div className="px-2 py-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAddCustomer(true)}
              >
                + Add New Vendor
              </Button>
            </div>
          </SelectContent>
        </Select>
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <CustomerForm
              onSubmit={(data) => {
                if (!currentWorkspace) return
                addCustomer({
                  ...data,
                  workspaceId: currentWorkspace.id
                })
                // Find the newly added customer in the customers array
                const newCustomer = customers.find((c: Customer) => 
                  c.businessName === data.businessName && 
                  c.email === data.email
                )
                if (newCustomer) {
                  setFormData(f => ({
                    ...f,
                    vendor: `${newCustomer.businessName}${newCustomer.email ? ` (${newCustomer.email})` : ""}`
                  }))
                }
                setShowAddCustomer(false)
              }}
              submitLabel="Add Vendor"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethodId">Payment Method</Label>
        <div className="flex flex-col">
          <Select
            value={formData.paymentMethodId}
            onValueChange={val => setFormData(f => ({ ...f, paymentMethodId: val }))}
          >
            <SelectTrigger id="paymentMethodId">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map(method => (
                <SelectItem key={method.id} value={method.id}>
                  <div className="flex items-center gap-2">
                    <span>{method.name}</span>
                    <Badge variant="secondary" className={getTypeColor(method.type)}>
                      {method.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="px-2 py-1 text-sm text-muted-foreground">
            Need a new payment method? <br />
            Please add it from <b>Preferences &rarr; Payment Methods</b> and come back to finish this expense. <br />
            You can always edit this expense later to assign a payment method.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about this expense..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <MultiSelect
          id="tags"
          value={tags}
          onValueChange={setTags}
          placeholder="Add or select tags"
          creatable
        >
          {tags.map(tag => (
            <MultiSelectItem key={tag} value={tag}>
              <Badge variant="secondary">{tag}</Badge>
            </MultiSelectItem>
          ))}
        </MultiSelect>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {expense ? "Update" : "Add"} Expense
        </Button>
      </div>
    </form>
  )
} 