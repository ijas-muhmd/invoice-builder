"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, FileText } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useFinancial, type Transaction } from "@/contexts/financial-context"
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"
import Link from "next/link"
import { currencyService } from "@/services/currency-service"

interface IncomeListProps {
  income: Transaction[]
  onEdit: (income: Transaction) => void
  compact?: boolean
}

export function IncomeList({ income, onEdit, compact = false }: IncomeListProps) {
  const { deleteTransaction, categories } = useFinancial()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === income.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(income.map(item => item.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return
    if (confirm(`Are you sure you want to delete ${selectedItems.size} selected income record${selectedItems.size > 1 ? 's' : ''}?`)) {
      selectedItems.forEach(id => deleteTransaction(id))
      setSelectedItems(new Set())
    }
  }

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Approved</Badge>
      case 'paid':
        return <Badge variant="outline" className="text-green-600 border-green-600">Received</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Cancelled</Badge>
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.name || 'Unknown'
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.color || '#6b7280'
  }

  const handleDelete = (incomeId: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      deleteTransaction(incomeId)
    }
  }

  function groupIncomeByDate(income: Transaction[]) {
    const groups: { [key: string]: Transaction[] } = {};
    income.forEach(incomeItem => {
      const date = new Date(incomeItem.date);
      let group = '';
      if (isToday(date)) {
        group = 'Today';
      } else if (isYesterday(date)) {
        group = 'Yesterday';
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        group = 'Last Week';
      } else if (isThisMonth(date)) {
        group = 'Last Month';
      } else {
        group = format(date, 'MMMM yyyy');
      }
      if (!groups[group]) groups[group] = [];
      groups[group].push(incomeItem);
    });
    const order = ['Today', 'Yesterday', 'Last Week', 'Last Month'];
    const monthGroups = Object.keys(groups).filter(g => !order.includes(g)).sort((a, b) => new Date(b + ' 1').getTime() - new Date(a + ' 1').getTime());
    const sortedKeys = [...order.filter(g => groups[g]), ...monthGroups];
    return sortedKeys.map(key => ({ label: key, items: groups[key] }));
  }

  const renderInvoiceLink = (incomeItem: Transaction) => {
    if (!incomeItem.invoiceId) return null;
    
    return (
      <Link 
        href={`/invoice/${incomeItem.invoiceId}`}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <FileText className="h-4 w-4 mr-1" />
        View
      </Link>
    );
  };

  if (income.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No income records found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start by adding your first income entry.
        </p>
      </div>
    )
  }

  if (compact) {
    const grouped = groupIncomeByDate(income);
    return (
      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.label}>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{group.label}</div>
            <div className="space-y-3">
              {group.items.map((incomeItem) => (
                <div key={incomeItem.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedItems.has(incomeItem.id)}
                      onCheckedChange={() => toggleSelect(incomeItem.id)}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(incomeItem.category) }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{incomeItem.title}</p>
                      <p className="text-sm text-gray-500">
                        {getCategoryName(incomeItem.category)} • {format(new Date(incomeItem.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{incomeItem.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      {incomeItem.currency !== "INR" && (
                        <span className="block text-xs text-gray-500">
                          ({incomeItem.currency} {incomeItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                        </span>
                      )}
                      {getStatusBadge(incomeItem.status)}
                      {renderInvoiceLink(incomeItem)}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(incomeItem)}
                        className="h-8 w-8 text-gray-500 hover:text-gray-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(incomeItem.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Table mode
  const grouped = groupIncomeByDate(income);
  return (
    <div className="space-y-4">
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{selectedItems.size} selected</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedItems.size === income.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map(group => [
              <TableRow key={group.label}>
                <TableCell colSpan={9} className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase py-2">{group.label}</TableCell>
              </TableRow>,
              ...group.items.map((incomeItem) => (
                <TableRow key={incomeItem.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(incomeItem.id)}
                      onCheckedChange={() => toggleSelect(incomeItem.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{incomeItem.title}</p>
                      {incomeItem.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {incomeItem.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(incomeItem.category) }}
                      />
                      <span>{getCategoryName(incomeItem.category)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      {incomeItem.currency} {incomeItem.amount.toFixed(2)}
                    </span>
                    {incomeItem.currency !== "INR" && (
                      <span className="block text-xs text-gray-500">
                        ({incomeItem.currency} {incomeItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(incomeItem.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {incomeItem.customer || '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(incomeItem.status)}
                  </TableCell>
                  <TableCell>
                    {renderInvoiceLink(incomeItem)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(incomeItem)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(incomeItem.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ])}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 