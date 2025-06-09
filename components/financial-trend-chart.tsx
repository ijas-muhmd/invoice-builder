import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinancial } from "@/contexts/financial-context"
import { format } from "date-fns"

function getCurrencySymbol(currency: string) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).formatToParts(0).find(part => part.type === 'currency')?.value || '$';
  } catch {
    return '$';
  }
}

export function FinancialTrendChart() {
  const { transactions } = useFinancial()
  const baseCurrency = 'USD';
  const baseCurrencySymbol = getCurrencySymbol(baseCurrency);

  // Calculate last 3 months' data
  const trendData = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = format(date, 'MMM')
      const year = date.getFullYear()
      const monthNum = date.getMonth()
      // Income
      const monthIncomeTx = transactions.filter(t => {
        if (t.type !== 'income') return false
        const tDate = new Date(t.date)
        return tDate.getMonth() === monthNum && tDate.getFullYear() === year
      })
      const monthIncome = monthIncomeTx.reduce((sum, t) => sum + (t.baseCurrencyAmount ?? t.amount), 0)
      // Expenses
      const monthExpenseTx = transactions.filter(t => {
        if (t.type !== 'expense') return false
        const tDate = new Date(t.date)
        return tDate.getMonth() === monthNum && tDate.getFullYear() === year
      })
      const monthExpenses = monthExpenseTx.reduce((sum, t) => sum + (t.baseCurrencyAmount ?? t.amount), 0)
      months.push({
        name: month,
        income: monthIncome,
        expenses: monthExpenses,
        incomeTx: monthIncomeTx,
        expenseTx: monthExpenseTx
      })
    }
    return months
  }, [transactions])

  // Find the max value for scaling (stacked: income + expenses)
  const maxValue = Math.max(
    ...trendData.map(m => m.income + m.expenses),
    1 // avoid division by zero
  )

  // Check if all values are zero
  const allZero = trendData.every(m => m.income === 0 && m.expenses === 0)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">3-Month Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {allZero ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data available</div>
        ) : (
          <div className="flex items-end justify-between h-48 w-full px-2 gap-4">
            {trendData.map((month, idx) => {
              const total = month.income + month.expenses
              const incomeHeight = total > 0 ? (month.income / maxValue) * 100 : 0
              const expenseHeight = total > 0 ? (month.expenses / maxValue) * 100 : 0
              // For tooltip: show original and converted if different
              const incomeTx = month.incomeTx.length > 0 ? month.incomeTx[0] : undefined
              const expenseTx = month.expenseTx.length > 0 ? month.expenseTx[0] : undefined
              return (
                <div key={month.name} className="flex flex-col items-center flex-1">
                  {/* Stacked Bar with hover tooltip */}
                  <div className="relative flex flex-col justify-end h-32 w-full max-w-[56px] rounded overflow-hidden bg-gray-100 group cursor-pointer">
                    {/* Expenses (bottom) */}
                    {month.expenses > 0 && (
                      <div
                        className="bg-red-500 w-full"
                        style={{ height: `${expenseHeight}%`, borderTopLeftRadius: month.income === 0 ? 6 : 0, borderTopRightRadius: month.income === 0 ? 6 : 0, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}
                      />
                    )}
                    {/* Income (top) */}
                    {month.income > 0 && (
                      <div
                        className="bg-green-500 w-full absolute left-0"
                        style={{ height: `${incomeHeight}%`, bottom: `${expenseHeight}%`, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}
                      />
                    )}
                    {/* Tooltip on hover */}
                    {(month.income > 0 || month.expenses > 0) && (
                      <div className="absolute left-1/2 bottom-full z-10 hidden group-hover:flex flex-col items-center w-max mb-2" style={{transform: 'translateX(-50%)'}}>
                        <div className="bg-white border border-gray-200 shadow-md rounded px-3 py-1 text-xs text-gray-900 whitespace-nowrap">
                          <strong>{month.name}</strong><br/>
                          {incomeTx && (
                            <>
                              Income: <span className="text-green-600">{getCurrencySymbol(incomeTx.currency)}{incomeTx.amount.toLocaleString()}</span>
                              {incomeTx.baseCurrencyAmount && incomeTx.currency !== baseCurrency && (
                                <span className="ml-1 text-gray-500">({baseCurrencySymbol}{incomeTx.baseCurrencyAmount.toLocaleString()} {baseCurrency})</span>
                              )}<br/>
                            </>
                          )}
                          {expenseTx && (
                            <>
                              Expenses: <span className="text-red-600">{getCurrencySymbol(expenseTx.currency)}{expenseTx.amount.toLocaleString()}</span>
                              {expenseTx.baseCurrencyAmount && expenseTx.currency !== baseCurrency && (
                                <span className="ml-1 text-gray-500">({baseCurrencySymbol}{expenseTx.baseCurrencyAmount.toLocaleString()} {baseCurrency})</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Month label */}
                  <span className="mt-2 text-xs text-muted-foreground">{month.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 