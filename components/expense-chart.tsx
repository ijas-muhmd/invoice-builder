"use client"

import { useFinancial, type Transaction } from "@/contexts/financial-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { format } from "date-fns"

interface ExpenseChartProps {
  type?: 'category' | 'trend' | 'default'
}

export function ExpenseChart({ type = 'default' }: ExpenseChartProps) {
  const { getTransactionsByType, getExpenseCategories, totalExpenses } = useFinancial()
  const expenses: Transaction[] = getTransactionsByType('expense')

  // Access categories directly from useFinancial
  const categories = getExpenseCategories()

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A233FF', '#33FFD1', '#A233FF']

  if (type === 'category') {
    // Category pie chart data
    const categoryData = categories.map(category => {
      const categoryExpenses = expenses.filter((expense: Transaction) => expense.category === category.id)
      const categoryTotal = categoryExpenses.reduce((sum: number, expense: Transaction) => sum + expense.inrAmount, 0)
      const percentage = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0
      
      return {
        name: category.name,
        value: categoryTotal,
        color: category.color || COLORS[Math.floor(Math.random() * COLORS.length)] // Fallback color
      }
    }).filter(item => item.value > 0).sort((a, b) => b.value - a.value)

    return (
      <Card className="border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md p-6">
        <CardHeader className="p-0 pb-4 bg-card">
          <CardTitle className="text-lg font-medium text-foreground">Top Categories</CardTitle>
          <CardDescription className="text-muted-foreground">Breakdown of expenses by category</CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-80 w-full bg-card">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${(percentage).toFixed(1)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No expense data available for categories.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (type === 'trend') {
    // Monthly trend data
    const now = new Date()
    const monthlyTrendData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthExpenses = expenses.filter((expense: Transaction) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getUTCMonth() === date.getUTCMonth() && 
               expenseDate.getUTCFullYear() === date.getUTCFullYear()
      })
      const monthTotal = monthExpenses.reduce((sum: number, expense: Transaction) => sum + expense.inrAmount, 0)
      const monthName = format(date, 'MMM')
      
      return {
        month: monthName,
        total: monthTotal,
        count: monthExpenses.length
      }
    }).reverse()

    return (
      <Card className="border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md p-6">
        <CardHeader className="p-0 pb-4 bg-card">
          <CardTitle className="text-lg font-medium text-foreground">Monthly Expense Trend</CardTitle>
          <CardDescription className="text-muted-foreground">Expenses over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-80 w-full bg-card">
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTrendData}
                margin={{
                  top: 10, right: 30, left: 0, bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis dataKey="month" className="text-sm text-gray-500" />
                <YAxis 
                  tickFormatter={(value) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
                  className="text-sm text-gray-500"
                />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}/>
                <Area type="monotone" dataKey="total" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No trend data available.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default chart - recent expenses overview
  const recentExpenses = expenses
    .slice(0, 5)
    .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      {recentExpenses.length > 0 ? (
        <div className="space-y-3">
          {recentExpenses.map((expense: Transaction) => {
            const category = categories.find(cat => cat.id === expense.category)
            
            return (
              <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category?.color || '#6b7280' }}
                  />
                  <div>
                    <p className="font-medium">{expense.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {category?.name || 'Unknown'} • {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="font-semibold">
                  {expense.currency} {expense.amount.toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No expenses to display
        </div>
      )}
    </div>
  )
} 