"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Filter, Download, Upload, Receipt, MoreHorizontal, ChevronRight } from "lucide-react"
import { useFinancial, type Transaction } from "@/contexts/financial-context"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { ExpensePreviewModal } from "@/components/expense-preview-modal"

export default function ExpenseListPage() {
  const { expenses, totalExpenses, monthlyExpenses, getExpenseCategories } = useFinancial()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | Transaction['status']>("all")
  const [filterCategory, setFilterCategory] = useState<string | "all">("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const expenseCategories = getExpenseCategories()
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const exportRef = useRef<HTMLDivElement>(null)

  const handleAddExpense = () => {
    setEditingExpense(null)
    setShowExpenseForm(true)
  }

  const handleEditExpense = (expense: Transaction) => {
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  const filteredExpenses = expenses.filter(exp => {
    let matchesStatus = true
    if (filterStatus !== "all") {
      matchesStatus = exp.status === filterStatus
    }

    let matchesCategory = true
    if (filterCategory !== "all") {
      matchesCategory = exp.category === filterCategory
    }

    let matchesDate = true
    if (dateRange?.from && exp.date) {
      matchesDate = isAfter(new Date(exp.date), startOfDay(dateRange.from)) || isEqual(new Date(exp.date), startOfDay(dateRange.from))
    }
    if (dateRange?.to && exp.date) {
      matchesDate = matchesDate && (isBefore(new Date(exp.date), endOfDay(dateRange.to)) || isEqual(new Date(exp.date), endOfDay(dateRange.to)))
    }

    return matchesStatus && matchesCategory && matchesDate
  })

  const resetFilters = () => {
    setFilterStatus("all")
    setFilterCategory("all")
    setDateRange(undefined)
  }

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

        const fileName = `expenses-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
        pdf.save(fileName)

        toast({
          title: "Export Successful",
          description: `Expenses report exported as ${fileName}`,
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

  const pendingExpenses = expenses.filter(exp => exp.status === 'pending')
  const paidExpenses = expenses.filter(exp => exp.status === 'paid')

  return (
    <div className="min-h-screen bg-background flex flex-row">
      {/* Main Content */}
      <div className="flex-1 px-4 py-6 max-w-6xl mx-auto">
        {/* Page Title and Action Buttons */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Expenses</h1>
          <div className="flex space-x-3">
            <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
              <DialogTrigger asChild>
                <Button onClick={handleAddExpense} className="bg-red-600 hover:bg-red-700 text-white px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                  </DialogTitle>
                </DialogHeader>
                <ExpenseForm
                  expense={editingExpense}
                  onSuccess={() => setShowExpenseForm(false)}
                  onCancel={() => setShowExpenseForm(false)}
                />
              </DialogContent>
            </Dialog>

            <ExpensePreviewModal expenses={filteredExpenses} expenseCategories={expenseCategories} />

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
                  {expenseCategories.map(category => (
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

        {/* All Expenses List - Main Table */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-foreground">All Expenses</h2>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View analytics
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <Card className="border border-border bg-card shadow-md">
            <CardContent className="p-0">
              {filteredExpenses.length > 0 ? (
                <ExpenseList
                  expenses={filteredExpenses}
                  onEdit={handleEditExpense}
                />
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Receipt className="h-16 w-16 mx-auto mb-6 text-muted-foreground/40" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No expenses recorded yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">Start tracking your expenses by adding your first record</p>
                  <Button 
                    onClick={handleAddExpense}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Expense
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-[340px] border-l bg-card px-4 py-6 flex flex-col gap-8 overflow-y-auto sticky top-0 h-screen">
        {/* Summary Block */}
        <div className="mb-8">
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-5xl font-light text-red-600 dark:text-red-400">
              ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <Button variant="ghost" size="sm" className="p-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
            <span>Total expenses</span>
            <span className="text-red-600 dark:text-red-400">+{expenses.length} records</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-4 space-y-4">
          {/* This Month */}
          <Card className="border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-2xl font-light text-red-600 dark:text-red-400">
                  ₹{monthlyExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <p className="text-foreground font-medium">This Month</p>
                <p className="text-sm text-muted-foreground">{currentMonth}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Expenses */}
          <Card className="border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-2xl font-light text-yellow-600 dark:text-yellow-400">
                  ₹{pendingExpenses.reduce((sum: number, exp: Transaction) => sum + exp.inrAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <p className="text-foreground font-medium">Pending</p>
                <p className="text-sm text-muted-foreground">{pendingExpenses.length} awaiting payment</p>
              </div>
            </CardContent>
          </Card>

          {/* Paid Expenses */}
          <Card className="border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-light text-green-600 dark:text-green-400">
                  ₹{paidExpenses.reduce((sum: number, exp: Transaction) => sum + exp.inrAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <p className="text-foreground font-medium">Paid</p>
                <p className="text-sm text-muted-foreground">{paidExpenses.length} completed payments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Categories Section */}
        <div className="mb-4">
          <h2 className="text-lg font-medium text-foreground mb-4">Top Categories</h2>
          <div className="grid grid-cols-2 gap-4">
            {expenseCategories.slice(0, 4).map((category) => {
              const categoryExpenses = expenses.filter((exp: Transaction) => exp.category === category.id)
              const categoryTotal = categoryExpenses.reduce((sum: number, exp: Transaction) => sum + exp.inrAmount, 0)
              return (
                <Card key={category.id} className="border border-border bg-card hover:shadow-lg transition-all duration-200 cursor-pointer shadow-sm">
                  <CardContent className="p-3 text-center">
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center border-2"
                      style={{ borderColor: category.color }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <p className="font-medium text-foreground text-xs mb-1 truncate" title={category.name}>
                      {category.name}
                    </p>
                    <p className="text-xs text-muted-foreground">₹{categoryTotal.toFixed(0)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Analytics Link */}
        <div className="mt-auto">
          <Button variant="ghost" size="sm" className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700" asChild>
            <a href="/expenses/analytics">
              View Analytics
              <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
      </aside>
    </div>
  )
} 