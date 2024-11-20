"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip } from "recharts"
import { useInvoices } from "@/contexts/invoice-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function InvoiceStats() {
  const { invoices } = useInvoices()
  const { currentWorkspace } = useWorkspace()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = React.useMemo(() => {
    const workspaceInvoices = currentWorkspace
      ? invoices.filter(inv => inv.workspaceId === currentWorkspace.id)
      : []

    const statusCounts = workspaceInvoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const calculateTotal = (status: string) => {
      return workspaceInvoices
        .filter(inv => inv.status === status)
        .reduce((sum, inv) => {
          const subtotal = inv.items.reduce((s, item) => s + (item.quantity * item.rate), 0)
          const tax = subtotal * (inv.tax / 100)
          return sum + subtotal + tax + inv.shipping - inv.discount
        }, 0)
    }

    return [
      { 
        status: 'paid', 
        count: statusCounts.paid || 0, 
        color: "hsl(142.1 76.2% 36.3%)",
        total: calculateTotal('paid')
      },
      { 
        status: 'pending', 
        count: statusCounts.pending || 0, 
        color: "hsl(47.9 95.8% 53.1%)",
        total: calculateTotal('pending')
      },
      { 
        status: 'overdue', 
        count: statusCounts.overdue || 0, 
        color: "hsl(346.8 77.2% 49.8%)",
        total: calculateTotal('overdue')
      },
      { 
        status: 'draft', 
        count: statusCounts.draft || 0, 
        color: "hsl(215.4 16.3% 46.9%)",
        total: calculateTotal('draft')
      },
    ]
  }, [invoices, currentWorkspace])

  const totalInvoices = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  // Don't render anything until mounted and there are invoices
  if (!mounted || totalInvoices === 0) return null

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium capitalize">{data.status}</p>
          <p className="text-sm text-muted-foreground">Count: {data.count}</p>
          <p className="text-sm text-muted-foreground">
            Total: ${data.total.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="mt-auto border-t pt-6">
      <div className="flex flex-col items-center">
        <div className="relative h-[160px]">
          <PieChart width={160} height={160}>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground font-medium"
            >
              {totalInvoices}
            </text>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm w-full">
          {chartData.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <div className="flex items-center gap-2">
                <span className="capitalize">{item.status}</span>
                <span className="text-muted-foreground">({item.count})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 