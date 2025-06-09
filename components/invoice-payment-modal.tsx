"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFinancial } from "@/contexts/financial-context"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Receipt } from "lucide-react"

interface InvoicePaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: {
    id: string
    number: string
    amount: number
    currency: string
    customerName: string
    customerCompany?: string
  }
  onConfirm: () => void
}

export function InvoicePaymentModal({ open, onOpenChange, invoice, onConfirm }: InvoicePaymentModalProps) {
  const { createTransactionFromInvoice, getIncomeCategories } = useFinancial()
  const [includeInIncome, setIncludeInIncome] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("sales")
  const [description, setDescription] = useState("")

  const incomeCategories = getIncomeCategories().filter((cat: any) => cat.type === 'income' || cat.type === 'both')

  const handleConfirm = () => {
    if (includeInIncome) {
      createTransactionFromInvoice({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        amount: invoice.amount,
        currency: invoice.currency,
        date: new Date().toISOString(),
        customer: invoice.customerCompany || invoice.customerName,
        description: description || `Payment received for invoice ${invoice.number}`
      })
    }
    onConfirm()
    onOpenChange(false)
  }

  const handleSkip = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-green-600" />
            <span>Invoice Payment Received</span>
          </DialogTitle>
          <DialogDescription>
            Great! Invoice {invoice.number} has been marked as paid. Would you like to add this payment as income to your financial tracker?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invoice</span>
              <Badge variant="outline">{invoice.number}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Customer</span>
              <span className="text-sm font-medium">{invoice.customerCompany || invoice.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-bold text-green-600">
                  {invoice.currency} {invoice.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Income Tracking Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="include-income"
                checked={includeInIncome}
                onChange={(e) => setIncludeInIncome(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="include-income" className="text-sm font-medium">
                Add this payment to my income tracker
              </Label>
            </div>

            {includeInIncome && (
              <div className="space-y-3 pl-7">
                <div className="space-y-2">
                  <Label htmlFor="category">Income Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Payment received for invoice ${invoice.number}`}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Benefits Explanation */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Why track this as income?
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Get a complete picture of your cash flow</li>
              <li>• Track business performance and growth</li>
              <li>• Generate financial reports for tax purposes</li>
              <li>• Monitor income vs expenses for profitability</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
            {includeInIncome ? "Add to Income Tracker" : "Mark as Paid Only"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 