"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Filter, 
  Download, 
  Upload,
  MoreHorizontal,
  ChevronRight
} from "lucide-react"
import { useFinancial, type Transaction } from "@/contexts/financial-context"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { IncomeForm } from "@/components/income-form"
import { IncomeList } from "@/components/income-list"
import { ExpenseChart } from "@/components/expense-chart"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { currencyService } from "@/services/currency-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { OverviewPreviewModal } from "@/components/overview-preview-modal"
import { eachMonthOfInterval, format, subMonths, endOfMonth, startOfMonth } from "date-fns"

export default function FinancialOverviewPage() {
  const { 
    expenses, 
    totalExpenses, 
    monthlyExpenses, 
    getExpenseCategories,
    getIncomeCategories,
    totalIncome, 
    monthlyIncome, 
    netIncome, 
    monthlyNetIncome, 
    getTransactionsByType,
    getAllCategories
  } = useFinancial()
  
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)
  const [editingIncome, setEditingIncome] = useState<Transaction | null>(null)
  const [converting, setConverting] = useState(false)

  // Get data
  const income = getTransactionsByType('income')
  const expenseCategories = getExpenseCategories()
  const incomeCategories = getIncomeCategories()
  const allCategories = getAllCategories()
  const totalCategories = expenseCategories.length + incomeCategories.length
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  // Calculate monthly aggregates for cash flow trend
  const monthlyAggregates = useMemo(() => {
    const allTransactions = [...expenses, ...income];
    const monthlyMap = new Map<string, { income: number; expenses: number }>();

    // Go back 6 months from current month
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    const months = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: endOfMonth(new Date())
    });

    months.forEach(month => {
      const monthKey = format(month, 'MMM yyyy');
      monthlyMap.set(monthKey, { income: 0, expenses: 0 });
    });

    allTransactions.forEach(tx => {
      const monthKey = format(new Date(tx.date), 'MMM yyyy');
      if (monthlyMap.has(monthKey)) {
        const currentMonthData = monthlyMap.get(monthKey)!;
        if (tx.type === 'income') {
          currentMonthData.income += tx.inrAmount;
        } else if (tx.type === 'expense') {
          currentMonthData.expenses += tx.inrAmount;
        }
        monthlyMap.set(monthKey, currentMonthData);
      }
    });

    return Array.from(monthlyMap.entries()).map(([name, data]) => ({
      name,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [expenses, income]);

  const handleAddExpense = () => {
    setEditingExpense(null)
    setShowExpenseForm(true)
  }

  const handleEditExpense = (expense: Transaction) => {
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  const handleAddIncome = () => {
    setEditingIncome(null)
    setShowIncomeForm(true)
  }

  const handleEditIncome = (incomeItem: Transaction) => {
    setEditingIncome(incomeItem)
    setShowIncomeForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">Financial Overview</h1>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
          {/* Main Balance Display */}
          <div className="mb-8">
            <div className="flex items-baseline space-x-2 mb-2">
              <span className="text-5xl font-light text-gray-900">
                ₹{Math.abs(netIncome).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <Button variant="ghost" size="sm" className="p-1">
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
              <span>Net balance</span>
              <Badge variant={netIncome >= 0 ? "secondary" : "destructive"} className="text-xs">
                {netIncome >= 0 ? "Profit" : "Loss"}
              </Badge>
            </div>
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Dialog open={showIncomeForm} onOpenChange={setShowIncomeForm}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddIncome} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                    <TrendingUp className="w-4 h-4 mr-2" />
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

              <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddExpense} variant="outline" className="px-6">
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

              <OverviewPreviewModal 
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                netIncome={netIncome}
                monthlyIncome={monthlyIncome}
                monthlyExpenses={monthlyExpenses}
                monthlyNetIncome={monthlyNetIncome}
                currentMonth={currentMonth}
                recentTransactions={[...income, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)}
                allCategories={[...expenseCategories, ...incomeCategories]}
                cashFlowTrend={monthlyAggregates}
              />

              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Financial Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Income */}
            <Card className="border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-light text-green-600">
                    ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <CardDescription>Total income earned</CardDescription>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card className="border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="text-2xl font-light text-red-600">
                    ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <CardDescription>Total expenses incurred</CardDescription>
              </CardContent>
            </Card>

            {/* Monthly Net */}
            <Card className="border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className={`text-2xl font-light ${monthlyNetIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ₹{Math.abs(monthlyNetIncome).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">This Month</p>
                  <p className="text-sm text-gray-500">{currentMonth}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* New section for charts and recent activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Top Categories Pie Chart */}
          <ExpenseChart type="category" />

          {/* Recent Expenses/Income (Default chart type) */}
          <Card className="border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-medium text-gray-900">Recent Activity</CardTitle>
              <CardDescription>Latest income and expense transactions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ExpenseChart type="default" />
            </CardContent>
          </Card>
        </div>

        {/* Available Categories (Simplified) */}
        

        {/* Monthly Trend Chart */}
        <div className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Monthly Trend</h2>
          <ExpenseChart type="trend" />
        </div>

        {/* Latest Transactions (Income/Expense Lists) - Optional, could be integrated into Recent Activity or moved to separate pages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card className="border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-medium text-gray-900">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {expenses.filter(exp => exp.inrAmount > 0).length > 0 ? (
                <ExpenseList 
                  expenses={expenses.filter(exp => exp.inrAmount > 0).slice(0, 3)}
                  onEdit={handleEditExpense}
                />
              ) : (
                <p className="text-center py-8 text-gray-500">No recent expenses.</p>
              )}
              <Link href="/expenses/list" className="text-blue-600 hover:text-blue-700 text-sm mt-4 block text-center">
                View All Expenses
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-medium text-gray-900">Recent Income</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {income.filter(inc => inc.inrAmount > 0).length > 0 ? (
                <IncomeList 
                  income={income.filter(inc => inc.inrAmount > 0).slice(0, 3)}
                  onEdit={handleEditIncome}
                />
              ) : (
                <p className="text-center py-8 text-gray-500">No recent income.</p>
              )}
              <Link href="/expenses/income" className="text-blue-600 hover:text-blue-700 text-sm mt-4 block text-center">
                View All Income
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
} 