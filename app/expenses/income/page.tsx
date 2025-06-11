"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Filter, Download, Upload, TrendingUp, MoreHorizontal, ChevronRight, Receipt, BarChart3, DollarSign } from "lucide-react"
import { useFinancial, type Transaction } from "@/contexts/financial-context"
import { IncomeForm } from "@/components/income-form"
import { IncomeList } from "@/components/income-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useInvoices } from "@/contexts/invoice-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, isBefore, isAfter, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, isEqual } from "date-fns"
import { cn } from "@/lib/utils"
import { type DateRange } from "react-day-picker"
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from "@/components/ui/use-toast"
import { IncomePreviewModal } from "@/components/income-preview-modal"

export default function IncomePage() {
  const { totalIncome, monthlyIncome, getTransactionsByType, addTransaction, transactions, getIncomeCategories, totalExpenses } = useFinancial()
  const { invoices } = useInvoices();
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Transaction | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | Transaction['status']>("all")
  const [filterCategory, setFilterCategory] = useState<string | "all">("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const incomeCategories = getIncomeCategories()
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const exportRef = useRef<HTMLDivElement>(null)

  // Get all income transactions, including invoice-derived
  const income = getTransactionsByType('income')

  const handleAddIncome = () => {
    setEditingIncome(null)
    setShowIncomeForm(true)
  }

  const handleEditIncome = (incomeItem: Transaction) => {
    setEditingIncome(incomeItem)
    setShowIncomeForm(true)
  }

  const filteredIncome = income.filter(inc => {
    let matchesStatus = true
    if (filterStatus !== "all") {
      matchesStatus = inc.status === filterStatus
    }

    let matchesCategory = true
    if (filterCategory !== "all") {
      matchesCategory = inc.category === filterCategory
    }

    let matchesDate = true
    if (dateRange?.from && inc.date) {
      matchesDate = isAfter(new Date(inc.date), startOfDay(dateRange.from)) || isEqual(new Date(inc.date), startOfDay(dateRange.from))
    }
    if (dateRange?.to && inc.date) {
      matchesDate = matchesDate && (isBefore(new Date(inc.date), endOfDay(dateRange.to)) || isEqual(new Date(inc.date), endOfDay(dateRange.to)))
    }

    return matchesStatus && matchesCategory && matchesDate
  })

  const resetFilters = () => {
    setFilterStatus("all")
    setFilterCategory("all")
    setDateRange(undefined)
  }

  // Manual sync handler
  const handleSyncInvoices = () => {
    invoices.forEach(invoice => {
      // Only sync paid or pending invoices
      if (invoice.status === 'paid' || invoice.status === 'pending') {
        const transactionId = `inv_${invoice.id}`;
        const exists = transactions.find(t => t.id === transactionId);
        const items = Array.isArray(invoice.items) ? invoice.items : [];
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const taxAmount = subtotal * ((invoice.tax || 0) / 100);
        const total = subtotal + (invoice.shipping || 0) + taxAmount - (invoice.discount || 0);
        const txStatus = invoice.status === 'paid' ? 'paid' : 'pending';
        if (!exists) {
          addTransaction({
            title: `Invoice Payment - ${invoice.number}`,
            amount: total,
            currency: invoice.currency || 'INR',
            category: 'invoice',
            date: typeof invoice.date === 'string' ? invoice.date : invoice.date?.toISOString() || new Date().toISOString(),
            description: `Payment received for invoice ${invoice.number}`,
            customer: invoice.customerId || '',
            status: txStatus,
            type: 'income',
            invoiceId: invoice.id,
            paymentMethodId: invoice.selectedBankAccountId,
          });
        }
      }
    });
  };

  const handleExportPDF = async () => {
    if (exportRef.current) {
      try {
        // Wait for render to ensure all data is in the DOM
        await new Promise(resolve => setTimeout(resolve, 500))

        const canvas = await html2canvas(exportRef.current, {
          scale: 2, // Higher scale for better quality
          useCORS: true, // Enable CORS for images
          logging: false,
          backgroundColor: '#ffffff'
        })

        const imgWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0

        const pdf = new jsPDF('p', 'mm', 'a4')
        let firstPage = true

        while (heightLeft >= 0) {
          if (!firstPage) {
            pdf.addPage()
          }
          
          pdf.addImage(
            canvas.toDataURL('image/png'),
            'PNG',
            0,
            position,
            imgWidth,
            imgHeight,
            '',
            'FAST'
          )
          
          heightLeft -= pageHeight
          position -= pageHeight
          firstPage = false
        }

        const fileName = `income-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
        pdf.save(fileName)

        toast({
          title: "Export Successful",
          description: `Income report exported as ${fileName}`,
        })
      } catch (error) {
        console.error('PDF Generation Error:', error)
        toast({
          title: "Export Failed",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const pendingIncome = income.filter(inc => inc.status === 'pending')
  const receivedIncome = income.filter(inc => inc.status === 'paid')

  return (
    <div className="min-h-screen bg-background flex flex-row">
      {/* Main Content */}
      <div className="flex-1 px-4 py-6 max-w-6xl mx-auto">
        {/* Page Title and Action Buttons */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Income</h1>
          <div className="flex space-x-3">
            <Dialog open={showIncomeForm} onOpenChange={setShowIncomeForm}>
              <DialogTrigger asChild>
                <Button onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700 text-white px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Income
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingIncome ? 'Edit Income' : 'Add New Income'}
                  </DialogTitle>
                </DialogHeader>
                <IncomeForm
                  income={editingIncome}
                  onSuccess={() => setShowIncomeForm(false)}
                  onCancel={() => setShowIncomeForm(false)}
                />
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="px-6" onClick={handleSyncInvoices}>
              Sync Invoices
            </Button>

            <IncomePreviewModal income={filteredIncome} incomeCategories={incomeCategories} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-6">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filterStatus} onValueChange={(value: string) => setFilterStatus(value as "all" | Transaction['status'])}>
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="approved">Approved</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="paid">Paid</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rejected">Rejected</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filterCategory} onValueChange={setFilterCategory}>
                  <DropdownMenuRadioItem value="all">All Categories</DropdownMenuRadioItem>
                  {incomeCategories.map(category => (
                    <DropdownMenuRadioItem key={category.id} value={category.id}>
                      {category.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
                <div className="p-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>{format(dateRange.from, "LLL dd, y")}-
                            {format(dateRange.to, "LLL dd, y")}</>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                      <div className="flex justify-between p-2">
                        <Button variant="ghost" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(new Date()) })}>Last Month</Button>
                        <Button variant="ghost" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 3)), to: endOfMonth(new Date()) })}>Last 3 Months</Button>
                        <Button variant="ghost" onClick={() => setDateRange(undefined)}>Clear Dates</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={resetFilters}>Clear All Filters</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* All Income List - Main Table */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-foreground">All Income Records</h2>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View analytics
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <Card className="border border-border bg-card shadow-md">
            <CardContent className="p-0">
              {filteredIncome.length > 0 ? (
                <IncomeList
                  income={filteredIncome}
                  onEdit={handleEditIncome}
                />
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <TrendingUp className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No income records yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">Start tracking your income by adding your first record</p>
                  <Button 
                    onClick={handleAddIncome}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Income
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden element for PDF export */}
      <div ref={exportRef} className="hidden p-8">
        <h1 className="text-2xl font-bold mb-4">Income Report</h1>
        <p className="text-muted-foreground mb-6">Generated on: {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
        {filteredIncome.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Amount (INR)</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncome.map(inc => (
                <tr key={inc.id} className="border-b border-border">
                  <td className="py-2">{format(new Date(inc.date), 'MMM dd, yyyy')}</td>
                  <td className="py-2">{inc.title}</td>
                  <td className="py-2">{incomeCategories.find(cat => cat.id === inc.category)?.name || 'N/A'}</td>
                  <td className="py-2">₹{inc.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 capitalize">{inc.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-muted-foreground">No income to export with current filters.</p>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="w-[340px] border-l bg-card px-4 py-6 flex flex-col gap-8 overflow-y-auto sticky top-0 h-screen">
        {/* Summary Block */}
        <div className="mb-8">
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-5xl font-light text-green-600 dark:text-green-400">
              ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <Button variant="ghost" size="sm" className="p-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
            <span>Total income earned</span>
            <span className="text-green-600 dark:text-green-400">+{income.length} records</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-4 space-y-4">
          {/* This Month */}
          <Card className="border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-light text-green-600 dark:text-green-400">
                  ₹{monthlyIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <p className="text-foreground font-medium">This Month</p>
                <p className="text-sm text-muted-foreground">{currentMonth}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Income */}
          <Card className="border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-2xl font-light text-yellow-600 dark:text-yellow-400">
                  ₹{pendingIncome.reduce((sum, inc) => sum + inc.inrAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <p className="text-foreground font-medium">Pending</p>
                <p className="text-sm text-muted-foreground">{pendingIncome.length} awaiting payment</p>
              </div>
            </CardContent>
          </Card>

          {/* Received Income */}
          <Card className="border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-light text-green-600 dark:text-green-400">
                  ₹{receivedIncome.reduce((sum, inc) => sum + inc.inrAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <p className="text-foreground font-medium">Received</p>
                <p className="text-sm text-muted-foreground">{receivedIncome.length} completed payments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Financial Health Indicators (Additional Insights) */}
        <div className="mb-4">
          <h2 className="text-lg font-medium text-foreground mb-4">Financial Health</h2>
          <div className="space-y-4">
            {/* Income Ratio */}
            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-2xl font-light text-blue-600 dark:text-blue-400">
                    {totalIncome > 0 ? ((totalIncome / (totalIncome + totalExpenses)) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div>
                  <p className="text-foreground font-medium">Income Ratio</p>
                  <p className="text-sm text-muted-foreground">Income vs total transactions</p>
                </div>
              </CardContent>
            </Card>

            {/* Average Income per Transaction */}
            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-2xl font-light text-orange-600 dark:text-orange-400">
                    ₹{(totalIncome / Math.max(income.length, 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <p className="text-foreground font-medium">Avg. Income</p>
                  <p className="text-sm text-muted-foreground">Per transaction</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </aside>
    </div>
  )
} 