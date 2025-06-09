"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Receipt, TrendingUp, Calendar, Filter, Download, Upload } from "lucide-react"
import { useFinancial, type Transaction } from "@/contexts/financial-context"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { ExpenseStats } from "@/components/expense-stats"
import { ExpenseChart } from "@/components/expense-chart"
import { IncomeForm } from "@/components/income-form"
import { IncomeList } from "@/components/income-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function ExpenseTracker() {
  const { expenses, totalExpenses, monthlyExpenses, categories, totalIncome, monthlyIncome, netIncome, monthlyNetIncome, getTransactionsByType } = useFinancial()
  
  // Get income transactions
  const income = getTransactionsByType('income')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)
  const [editingIncome, setEditingIncome] = useState<Transaction | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'income', 'expenses', 'analytics', 'categories', 'cash-flow'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

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

  const pendingExpenses = expenses.filter(exp => exp.status === 'pending')
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved')
  const paidExpenses = expenses.filter(exp => exp.status === 'paid')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financial Tracker</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your income and expenses
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={showIncomeForm} onOpenChange={setShowIncomeForm}>
              <DialogTrigger asChild>
                <Button onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700">
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
            <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
              <DialogTrigger asChild>
                <Button onClick={handleAddExpense} variant="outline">
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
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +{income.length} income record{income.length !== 1 ? 's' : ''} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +{expenses.length} expense{expenses.length !== 1 ? 's' : ''} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(netIncome).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {netIncome >= 0 ? 'Profit' : 'Loss'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthlyNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(monthlyNetIncome).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentMonth} {monthlyNetIncome >= 0 ? 'profit' : 'loss'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Badge variant="outline" className="text-xs">
                {pendingExpenses.length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${pendingExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                Active categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Income</CardTitle>
                  <CardDescription>Your latest income entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <IncomeList
                    income={income.slice(0, 5)}
                    onEdit={handleEditIncome}
                    compact={true}
                  />
                  {income.length > 5 && (
                    <Button variant="ghost" className="w-full mt-4" onClick={() => setActiveTab("income")}>
                      View All Income
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Your latest expense entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseList
                    expenses={expenses.slice(0, 5)}
                    onEdit={handleEditExpense}
                    compact={true}
                  />
                  {expenses.length > 5 && (
                    <Button variant="ghost" className="w-full mt-4" onClick={() => setActiveTab("expenses")}>
                      View All Expenses
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense by Category</CardTitle>
                  <CardDescription>Monthly breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Cash Flow</CardTitle>
                  <CardDescription>Income vs Expenses overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="font-medium">Monthly Income</span>
                      </div>
                      <span className="font-semibold text-green-600">${monthlyIncome.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="font-medium">Monthly Expenses</span>
                      </div>
                      <span className="font-semibold text-red-600">${monthlyExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg border-primary/20 bg-primary/5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${monthlyNetIncome >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">Net Income</span>
                      </div>
                      <span className={`font-semibold ${monthlyNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(monthlyNetIncome).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Expense Statistics</CardTitle>
                <CardDescription>Detailed insights into your spending</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseStats />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Income</CardTitle>
                    <CardDescription>Manage all your income records</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <IncomeList
                  income={income}
                  onEdit={handleEditIncome}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Expenses</CardTitle>
                    <CardDescription>Manage all your expense records</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ExpenseList
                  expenses={expenses}
                  onEdit={handleEditExpense}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spending Trends</CardTitle>
                  <CardDescription>Monthly expense trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart type="trend" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Expenses by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart type="category" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Financial Categories</CardTitle>
                    <CardDescription>Manage your income and expense categories</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => {
                    const categoryTransactions = [...expenses, ...income].filter(transaction => transaction.category === category.id)
                    const categoryExpenses = expenses.filter(exp => exp.category === category.id)
                    const categoryIncome = income.filter(inc => inc.category === category.id)
                    const categoryExpenseTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
                    const categoryIncomeTotal = categoryIncome.reduce((sum, inc) => sum + inc.amount, 0)
                    
                    return (
                      <Card key={category.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <Badge variant="secondary" className="text-xs">
                            {category.type}
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {category.description}
                        </p>
                        <div className="space-y-1">
                          {categoryIncomeTotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">Income:</span>
                              <span className="font-semibold text-green-600">${categoryIncomeTotal.toFixed(2)}</span>
                            </div>
                          )}
                          {categoryExpenseTotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-red-600">Expenses:</span>
                              <span className="font-semibold text-red-600">${categoryExpenseTotal.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cash-flow">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow Analysis</CardTitle>
                  <CardDescription>Detailed income vs expenses breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-green-600">Income Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between p-3 border rounded">
                          <span>Total Income</span>
                          <span className="font-semibold text-green-600">${totalIncome.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-3 border rounded">
                          <span>Monthly Income</span>
                          <span className="font-semibold text-green-600">${monthlyIncome.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-3 border rounded">
                          <span>Income Entries</span>
                          <span className="font-semibold">{income.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-red-600">Expense Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between p-3 border rounded">
                          <span>Total Expenses</span>
                          <span className="font-semibold text-red-600">${totalExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-3 border rounded">
                          <span>Monthly Expenses</span>
                          <span className="font-semibold text-red-600">${monthlyExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-3 border rounded">
                          <span>Expense Entries</span>
                          <span className="font-semibold">{expenses.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                    <h4 className="font-semibold mb-4">Net Position</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span>Overall Net Income:</span>
                        <span className={`font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {netIncome >= 0 ? '+' : '-'}${Math.abs(netIncome).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Net Income:</span>
                        <span className={`font-bold ${monthlyNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {monthlyNetIncome >= 0 ? '+' : '-'}${Math.abs(monthlyNetIncome).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 