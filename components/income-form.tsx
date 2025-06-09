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
import { useBankAccounts } from '@/contexts/bank-accounts-context'
import { useInvoices } from '@/contexts/invoice-context'
import { useCustomers } from '@/contexts/customer-context'
import { PreferencesDialog } from "@/components/preferences-dialog"
import { CustomerForm } from "@/components/customer-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type Customer } from "@/contexts/customer-context"
import { useWorkspace } from "@/contexts/workspace-context"

interface IncomeFormProps {
  income?: Transaction | null
  onSuccess: () => void
  onCancel: () => void
}

export function IncomeForm({ income, onSuccess, onCancel }: IncomeFormProps) {
  const { addTransaction, updateTransaction, getIncomeCategories, transactions } = useFinancial()
  const { bankAccounts } = useBankAccounts()
  const { invoices } = useInvoices()
  const { customers, addCustomer } = useCustomers()
  const { currentWorkspace } = useWorkspace()
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [conversionRate, setConversionRate] = useState('1')
  const [syncingRate, setSyncingRate] = useState(false)
  const [inrAmountPreview, setInrAmountPreview] = useState('0.00')

  // Cache for exchange rates
  const exchangeRateCache = useRef<{[key: string]: number}>({})

  // Filter invoices: only those not already linked to an income transaction
  const availableInvoices = invoices.filter(inv => {
    if (inv.status !== 'paid') return false
    return !transactions.some(t => t.invoiceId === inv.id)
  })

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    currency: "USD",
    category: "",
    date: new Date(),
    description: "",
    customer: "",
    status: "paid" as Transaction['status'],
    paymentMethodId: ""
  })

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
    console.log('Triggering auto-fetch useEffect...', { currency: formData.currency, income: income })
    if (formData.currency !== 'INR') {
      const shouldFetch = !income || (income.currency !== formData.currency || typeof income.conversionRate !== 'number')
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
  }, [formData.currency, fetchConversionRate, income])

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

  useEffect(() => {
    if (income) {
      setFormData({
        title: income.title,
        amount: income.amount.toString(),
        currency: income.currency,
        category: income.category,
        date: new Date(income.date),
        description: income.description || "",
        customer: income.customer || "",
        status: income.status,
        paymentMethodId: income.paymentMethodId || ""
      })
      setSelectedInvoiceId(income.invoiceId || null)
      // Set conversion rate from existing income if available
      setConversionRate(income.conversionRate?.toString() || '1')
    }
  }, [income])

  // When invoice is selected, auto-fill fields
  useEffect(() => {
    if (selectedInvoiceId) {
      const invoice = invoices.find(inv => inv.id === selectedInvoiceId)
      if (invoice) {
        const items = Array.isArray(invoice.items) ? invoice.items : []
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
        const taxAmount = subtotal * ((invoice.tax || 0) / 100)
        const total = subtotal + (invoice.shipping || 0) + taxAmount - (invoice.discount || 0)
        // Find customer by customerId or businessName
        let customerDetails = ''
        if (invoice.customerId) {
          const customer = customers.find(c => c.id === invoice.customerId)
          if (customer) {
            customerDetails = `${customer.businessName}${customer.email ? ' (' + customer.email + ')' : ''}`
          }
        } else if (invoice.to?.businessName) {
          const customer = customers.find(c => c.businessName === invoice.to.businessName)
          if (customer) {
            customerDetails = `${customer.businessName}${customer.email ? ' (' + customer.email + ')' : ''}`
          }
        }
        setFormData(f => ({
          ...f,
          title: `Invoice Payment - ${invoice.number}`,
          amount: total.toString(),
          currency: invoice.currency || 'USD',
          customer: customerDetails || invoice.customerId || invoice.to?.businessName || '',
          description: `Payment received for invoice ${invoice.number}`,
          date: invoice.date ? (typeof invoice.date === 'string' ? new Date(invoice.date) : invoice.date) : new Date(),
          category: 'sales',
          paymentMethodId: invoice.selectedBankAccountId || '',
          status: invoice.status === 'paid' ? 'paid' : 'pending',
        }))
      }
    }
  }, [selectedInvoiceId, invoices, customers])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const rate = formData.currency === 'INR' ? 1 : parseFloat(conversionRate)
    const inrAmount = parseFloat(formData.amount) * rate
    const incomeData = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category: formData.category,
      date: formData.date.toISOString(),
      description: formData.description,
      customer: formData.customer,
      status: formData.status,
      paymentMethodId: formData.paymentMethodId,
      conversionRate: rate,
      inrAmount,
      ...(selectedInvoiceId ? { invoiceId: selectedInvoiceId } : {})
    }
    if (income) {
      updateTransaction({
        ...income,
        ...incomeData,
      })
    } else {
      addTransaction({
        ...incomeData,
        type: 'income'
      })
    }
    onSuccess()
  }

  // Get income categories
  const incomeCategories = getIncomeCategories()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Income Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Client Payment, Sales Revenue"
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
              <SelectValue placeholder="Select income category" />
            </SelectTrigger>
            <SelectContent>
              {incomeCategories.map((category) => (
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
        <Label htmlFor="customer">Customer / Income Source *</Label>
        <Select
          value={formData.customer}
          onValueChange={val => {
            const selectedCustomer = customers.find((c: Customer) => c.id === val)
            if (selectedCustomer) {
              setFormData(f => ({
                ...f,
                customer: `${selectedCustomer.businessName}${selectedCustomer.email ? ` (${selectedCustomer.email})` : ""}`
              }))
            }
          }}
          required
        >
          <SelectTrigger id="customer">
            <SelectValue placeholder="Select or add customer/income source">
              {formData.customer || "Select a customer"}
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
                + Add New Customer
              </Button>
            </div>
          </SelectContent>
        </Select>
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
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
                    customer: `${newCustomer.businessName}${newCustomer.email ? ` (${newCustomer.email})` : ""}`
                  }))
                }
                setShowAddCustomer(false)
              }}
              submitLabel="Add Customer"
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
            <SelectItem value="paid">Received</SelectItem>
            <SelectItem value="rejected">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethodId">Received Bank Account *</Label>
        {bankAccounts.length === 0 ? (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">
              No bank accounts found. You can add one in Preferences → Bank Accounts.
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(true)}
            >
              Add Bank Account
            </Button>
            <PreferencesDialog
              open={showPreferences}
              onOpenChange={setShowPreferences}
              initialCategory="Banking"
              initialItem="Bank Accounts"
            />
          </div>
        ) : (
          <>
            <Select
              value={formData.paymentMethodId}
              onValueChange={val => setFormData(f => ({ ...f, paymentMethodId: val }))}
              required
            >
              <SelectTrigger id="paymentMethodId">
                <SelectValue placeholder="Select received bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bankName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground mt-1">
              You can add or update the received bank account later.
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about this income..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoice">Link to Invoice</Label>
        <Select
          value={selectedInvoiceId || 'none'}
          onValueChange={val => setSelectedInvoiceId(val === 'none' ? null : val)}
        >
          <SelectTrigger id="invoice">
            <SelectValue placeholder="Select invoice (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {availableInvoices.map(inv => (
              <SelectItem key={inv.id} value={inv.id}>
                {inv.number} — {inv.to?.businessName || inv.customerId || ''} — {inv.currency} {(() => {
                  const items = Array.isArray(inv.items) ? inv.items : []
                  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
                  const taxAmount = subtotal * ((inv.tax || 0) / 100)
                  const total = subtotal + (inv.shipping || 0) + taxAmount - (inv.discount || 0)
                  return total.toFixed(2)
                })()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {income ? "Update" : "Add"} Income
        </Button>
      </div>
    </form>
  )
} 