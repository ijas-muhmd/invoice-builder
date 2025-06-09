"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useFinancial } from "@/contexts/financial-context"
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react"

export function ExpenseStats() {
  const { expenses, categories, totalExpenses, monthlyExpenses } = useFinancial()

  // Calculate stats for current month vs previous month
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && 
           expenseDate.getFullYear() === currentYear
  })

  const previousMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === previousMonth && 
           expenseDate.getFullYear() === previousYear
  })

  const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.inrAmount, 0)
  
  const monthlyChange = previousMonthTotal > 0 
    ? ((monthlyExpenses - previousMonthTotal) / previousMonthTotal) * 100 
    : 0

  // Category breakdown with percentages
  const categoryStats = categories.map(category => {
    const categoryExpenses = expenses.filter(expense => expense.category === category.id)
    const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.inrAmount, 0)
    const percentage = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0
    
    return {
      ...category,
      total: categoryTotal,
      percentage,
      count: categoryExpenses.length
    }
  }).sort((a, b) => b.total - a.total)

  // Average expense calculation
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0

  // Top spending days
  const dailySpending = expenses.reduce((acc, expense) => {
    const day = new Date(expense.date).toDateString()
    acc[day] = (acc[day] || 0) + expense.inrAmount
    return acc
  }, {} as Record<string, number>)

  const topSpendingDay = Object.entries(dailySpending)
    .sort(([,a], [,b]) => b - a)[0]

  return (
    <div className="space-y-6">
      {/* Monthly Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Change</CardTitle>
            {monthlyChange >= 0 ? 
              <TrendingUp className="h-4 w-4 text-red-500" /> : 
              <TrendingDown className="h-4 w-4 text-green-500" />
            }
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs last month (₹{previousMonthTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              per expense entry
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{topSpendingDay ? topSpendingDay[1].toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topSpendingDay ? new Date(topSpendingDay[0]).toLocaleDateString() : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>
            Your expense distribution across different categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryStats.slice(0, 6).map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({category.count} expense{category.count !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">₹{category.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs text-muted-foreground">
                      {category.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress 
                  value={category.percentage} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
          <CardDescription>
            Last 6 months expense summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }, (_, i) => {
              const date = new Date(currentYear, currentMonth - i, 1)
              const monthExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date)
                return expenseDate.getMonth() === date.getMonth() && 
                       expenseDate.getFullYear() === date.getFullYear()
              })
              const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.inrAmount, 0)
              const monthName = date.toLocaleDateString('default', { month: 'short', year: 'numeric' })
              const maxMonthly = Math.max(...Array.from({ length: 6 }, (_, j) => {
                const checkDate = new Date(currentYear, currentMonth - j, 1)
                const checkExpenses = expenses.filter(expense => {
                  const expenseDate = new Date(expense.date)
                  return expenseDate.getMonth() === checkDate.getMonth() && 
                         expenseDate.getFullYear() === checkDate.getFullYear()
                })
                return checkExpenses.reduce((sum, expense) => sum + expense.inrAmount, 0)
              }))
              const percentage = maxMonthly > 0 ? (monthTotal / maxMonthly) * 100 : 0

              return (
                <div key={monthName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{monthName}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">₹{monthTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground">
                        {monthExpenses.length} expense{monthExpenses.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 