"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Customer } from "@/contexts/customer-context"
import { Invoice } from "@/contexts/invoice-context"
import { 
  calculateInvoiceTotal, 
  calculateInvoiceBalance, 
  formatCurrency 
} from "@/lib/customer-financial-utils"
import { 
  Search, 
  Eye, 
  Edit, 
  ArrowUpDown,
  FileText,
  Calendar,
  DollarSign
} from "lucide-react"

interface CustomerInvoicesProps {
  customer: Customer
  invoices: Invoice[]
  onEdit?: (invoiceId: string) => void
  onView?: (invoiceId: string) => void
}

type SortField = 'date' | 'dueDate' | 'number' | 'total' | 'status'
type SortDirection = 'asc' | 'desc'

export function CustomerInvoices({ 
  customer, 
  invoices, 
  onEdit, 
  onView 
}: CustomerInvoicesProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const customerInvoices = useMemo(() => {
    return invoices.filter(invoice => 
      invoice.customerId === customer.id || 
      invoice.to?.businessName === customer.businessName
    )
  }, [invoices, customer])

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = customerInvoices.filter(invoice => {
      const matchesSearch = 
        invoice.number.toLowerCase().includes(search.toLowerCase()) ||
        invoice.notes?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.poNumber?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // Sort invoices
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'dueDate':
          aValue = new Date(a.dueDate)
          bValue = new Date(b.dueDate)
          break
        case 'number':
          aValue = a.number
          bValue = b.number
          break
        case 'total':
          aValue = calculateInvoiceTotal(a)
          bValue = calculateInvoiceTotal(b)
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [customerInvoices, search, statusFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/10 text-gray-500'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'paid':
        return 'bg-green-500/10 text-green-500'
      case 'overdue':
        return 'bg-red-500/10 text-red-500'
      default:
        return ''
    }
  }

  const handleEdit = (invoiceId: string) => {
    if (onEdit) {
      onEdit(invoiceId)
    } else {
      router.push(`/invoice/${invoiceId}`)
    }
  }

  const handleView = (invoiceId: string) => {
    if (onView) {
      onView(invoiceId)
    } else {
      router.push(`/invoice/${invoiceId}`)
    }
  }

  const totals = useMemo(() => {
    const totalAmount = filteredAndSortedInvoices.reduce((sum, invoice) => 
      sum + calculateInvoiceTotal(invoice), 0
    )
    const totalPaid = filteredAndSortedInvoices.reduce((sum, invoice) => 
      sum + (invoice.amountPaid || 0), 0
    )
    const totalOutstanding = filteredAndSortedInvoices.reduce((sum, invoice) => 
      sum + calculateInvoiceBalance(invoice), 0
    )

    return { totalAmount, totalPaid, totalOutstanding }
  }, [filteredAndSortedInvoices])

  // Get currency from first invoice or default to EUR
  const currency = customerInvoices[0]?.currency || 'EUR'

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-medium">
                  {formatCurrency(totals.totalAmount, currency)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-lg font-medium text-green-600">
                  {formatCurrency(totals.totalPaid, currency)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-lg font-medium text-yellow-600">
                  {formatCurrency(totals.totalOutstanding, currency)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Customer Invoices ({filteredAndSortedInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAndSortedInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found for this customer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('number')}
                    >
                      Invoice Number
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('dueDate')}
                    >
                      Due Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('total')}
                    >
                      Total
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedInvoices.map((invoice) => {
                  const total = calculateInvoiceTotal(invoice)
                  const balance = calculateInvoiceBalance(invoice)
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(total, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={balance > 0 ? 'text-yellow-600' : 'text-green-600'}>
                          {formatCurrency(balance, currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(invoice.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(invoice.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 