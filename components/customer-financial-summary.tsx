"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Customer } from "@/contexts/customer-context"
import { Invoice } from "@/contexts/invoice-context"
import { 
  calculateCustomerFinancialSummary, 
  formatCurrency,
  CustomerFinancialSummary 
} from "@/lib/customer-financial-utils"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  AlertTriangle,
  FileText,
  Calendar,
  Target
} from "lucide-react"
import { format } from "date-fns"

interface CustomerFinancialSummaryProps {
  customer: Customer
  invoices: Invoice[]
  className?: string
}

export function CustomerFinancialSummaryComponent({ 
  customer, 
  invoices, 
  className 
}: CustomerFinancialSummaryProps) {
  const financialSummary = useMemo(() => 
    calculateCustomerFinancialSummary(customer, invoices), 
    [customer, invoices]
  )

  const paymentRate = financialSummary.totalIncome > 0 
    ? (financialSummary.totalPaid / financialSummary.totalIncome) * 100 
    : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'overdue':
        return 'bg-red-500/10 text-red-500'
      case 'draft':
        return 'bg-gray-500/10 text-gray-500'
      default:
        return ''
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary.totalIncome, financialSummary.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.totalInvoices} invoice{financialSummary.totalInvoices !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary.totalPaid, financialSummary.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentRate.toFixed(1)}% payment rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(financialSummary.totalOutstanding, financialSummary.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialSummary.totalOverdue, financialSummary.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Payment Progress
            </CardTitle>
            <CardDescription>
              Track payment completion for this customer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Payment Rate</span>
                <span>{paymentRate.toFixed(1)}%</span>
              </div>
              <Progress value={paymentRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Paid</div>
                <div className="font-medium">
                  {formatCurrency(financialSummary.totalPaid, financialSummary.currency)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Remaining</div>
                <div className="font-medium">
                  {formatCurrency(financialSummary.totalOutstanding, financialSummary.currency)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Status
            </CardTitle>
            <CardDescription>
              Breakdown of invoices by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(financialSummary.invoicesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getStatusColor(status)}>
                      {status.toUpperCase()}
                    </Badge>
                    <span className="text-sm">{count} invoice{count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Additional Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Average Invoice Amount</div>
              <div className="text-lg font-medium">
                {formatCurrency(financialSummary.averageInvoiceAmount, financialSummary.currency)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Last Invoice Date</div>
              <div className="text-lg font-medium">
                {financialSummary.lastInvoiceDate 
                  ? format(financialSummary.lastInvoiceDate, 'MMM dd, yyyy')
                  : 'No invoices'
                }
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Total Invoices</div>
              <div className="text-lg font-medium">
                {financialSummary.totalInvoices}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      {(financialSummary.totalOverdue > 0 || financialSummary.totalOutstanding > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Action Required</CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700">
            <div className="space-y-2">
              {financialSummary.totalOverdue > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    {formatCurrency(financialSummary.totalOverdue, financialSummary.currency)} in overdue payments
                  </span>
                </div>
              )}
              {financialSummary.totalOutstanding > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {formatCurrency(financialSummary.totalOutstanding, financialSummary.currency)} in outstanding balance
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 