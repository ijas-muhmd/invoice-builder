"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinancial, type Transaction } from "@/contexts/financial-context"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Filter, Download, Target } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, isBefore, isAfter, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth, isEqual } from 'date-fns'
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
import { cn } from "@/lib/utils"
import { type DateRange } from "react-day-picker"
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { CashFlowPreviewModal } from "@/components/cash-flow-preview-modal"

export default function CashFlowPage() {
  const { 
    expenses, 
    totalExpenses, 
    monthlyExpenses, 
    totalIncome, 
    monthlyIncome, 
    netIncome, 
    monthlyNetIncome, 
    getTransactionsByType, 
    getAllCategories,
  } = useFinancial()

  const allTransactions = [...expenses, ...getTransactionsByType('income')]
  const allCategories = getAllCategories()
  const [filterCategory, setFilterCategory] = useState<string | "all">("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const exportRef = useRef<HTMLDivElement>(null)

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  const filteredTransactions = allTransactions.filter(tx => {
    let matchesCategory = true
    if (filterCategory !== "all") {
      matchesCategory = tx.category === filterCategory
    }

    let matchesDate = true
    if (dateRange?.from && tx.date) {
      matchesDate = isAfter(new Date(tx.date), startOfDay(dateRange.from)) || isEqual(new Date(tx.date), startOfDay(dateRange.from))
    }
    if (dateRange?.to && tx.date) {
      matchesDate = matchesDate && (isBefore(new Date(tx.date), endOfDay(dateRange.to)) || isEqual(new Date(tx.date), endOfDay(dateRange.to)))
    }

    return matchesCategory && matchesDate
  })

  const resetFilters = () => {
    setFilterCategory("all")
    setDateRange(undefined)
  }

  // Calculate cash flow trend (last 6 months)
  const getCashFlowTrend = () => {
    const now = new Date()
    const months = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthTransactions = filteredTransactions.filter(tx => {
        const txDate = new Date(tx.date)
        return txDate.getUTCMonth() === date.getUTCMonth() && 
               txDate.getUTCFullYear() === date.getUTCFullYear()
      })
      
      const monthIncomeTotal = monthTransactions.filter(tx => tx.type === 'income').reduce((sum, inc) => sum + inc.inrAmount, 0)
      const monthExpenseTotal = monthTransactions.filter(tx => tx.type === 'expense').reduce((sum, exp) => sum + exp.inrAmount, 0)
      const monthNet = monthIncomeTotal - monthExpenseTotal
      
      months.push({
        name: format(date, 'MMM yy'),
        income: monthIncomeTotal,
        expenses: monthExpenseTotal,
        net: monthNet
      })
    }
    
    return months
  }

  const cashFlowTrend = getCashFlowTrend()
  const maxAmount = Math.max(...cashFlowTrend.map(month => Math.max(month.income, month.expenses)))

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

        const fileName = `cash-flow-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
        pdf.save(fileName)

        toast({
          title: "Export Successful",
          description: `Cash flow report exported as ${fileName}`,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-foreground">Cash Flow</h1>
            <div className="flex space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="px-6">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={filterCategory} onValueChange={setFilterCategory}>
                    <DropdownMenuRadioItem value="all">All Categories</DropdownMenuRadioItem>
                    {allCategories.map(category => (
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
              <CashFlowPreviewModal 
                filteredTransactions={filteredTransactions}
                cashFlowTrend={cashFlowTrend}
                allCategories={allCategories}
                netIncome={netIncome}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                filterCategory={filterCategory}
                dateRange={dateRange}
              />
            </div>
          </div>
          
          {/* Net Cash Flow Display */}
          <div className="mb-6">
            <div className="flex items-baseline space-x-2 mb-2">
              <span className={`text-5xl font-light ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netIncome >= 0 ? '+' : '-'}₹{Math.abs(netIncome).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
              <span>Net cash flow</span>
              <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                netIncome >= 0 
                  ? 'border-green-200 bg-green-50 text-green-700' 
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}>
                {netIncome >= 0 ? 'Positive' : 'Negative'}
              </div>
            </div>
            
            {/* Quick Action Buttons - removed as filters and export buttons are now at the top */}
            {/* <div className="flex space-x-3">
              <button className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
                <Activity className="w-4 h-4 mr-2" />
                View Details
              </button>
              <button className="inline-flex items-center px-6 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                Export Report
              </button>
            </div> */}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-foreground mb-6">Financial Summary</h2>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Net Cash Flow */}
            <Card className={`border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${netIncome >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} rounded-full flex items-center justify-center`}>
                    {netIncome >= 0 ? 
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /> : 
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <span className={`text-2xl font-light ${netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {netIncome >= 0 ? '+' : '-'}₹{Math.abs(netIncome).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <p className="text-foreground font-medium">Net Cash Flow</p>
                  <p className="text-sm text-muted-foreground">Overall financial position</p>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Net */}
            <Card className={`border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${monthlyNetIncome >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} rounded-full flex items-center justify-center`}>
                    {monthlyNetIncome >= 0 ? 
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /> : 
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <span className={`text-2xl font-light ${monthlyNetIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {monthlyNetIncome >= 0 ? '+' : '-'}₹{Math.abs(monthlyNetIncome).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <p className="text-foreground font-medium">Monthly Net</p>
                  <p className="text-sm text-muted-foreground">{currentMonth}</p>
                </div>
              </CardContent>
            </Card>

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

            {/* Burn Rate */}
            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-2xl font-light text-orange-600 dark:text-orange-400">
                    ₹{(totalExpenses / Math.max(expenses.length, 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <p className="text-foreground font-medium">Burn Rate</p>
                  <p className="text-sm text-muted-foreground">Average expense per transaction</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-foreground mb-6">Cash Flow Trend (Last 6 Months)</h2>
          <Card className="border border-border bg-card shadow-md">
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={cashFlowTrend}
                  margin={{
                    top: 5, right: 30, left: 20, bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    domain={[0, maxAmount + (maxAmount * 0.1)]} // Add 10% padding to max
                  />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" activeDot={{ r: 8 }} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" activeDot={{ r: 8 }} name="Expenses" />
                  <Line type="monotone" dataKey="net" stroke="#3b82f6" activeDot={{ r: 8 }} name="Net Cash Flow" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Summary (Optional: detailed list of filtered transactions) */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-foreground mb-6">Filtered Transactions</h2>
          <Card className="border border-border bg-card shadow-md">
            <CardContent className="p-0">
              {filteredTransactions.length > 0 ? (
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount (INR)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{format(new Date(tx.date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-foreground">{tx.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{allCategories.find(cat => cat.id === tx.category)?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{tx.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">₹{tx.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-foreground">{tx.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Target className="h-16 w-16 mx-auto mb-6 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No transactions match current filters</h3>
                  <p className="text-sm text-muted-foreground mb-6">Try adjusting your filter settings.</p>
                  <Button onClick={resetFilters}>Clear Filters</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 