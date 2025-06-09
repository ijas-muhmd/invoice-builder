"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useFinancial, type Transaction } from "@/contexts/financial-context"
import { format, isToday, isYesterday, isThisWeek, isThisMonth, subWeeks, subMonths, isSameMonth, parseISO } from "date-fns"
import { currencyService } from "@/services/currency-service"

interface ExpenseListProps {
  expenses: Transaction[]
  onEdit: (expense: Transaction) => void
  compact?: boolean
}

function groupExpensesByDate(expenses: Transaction[]) {
  const groups: { [key: string]: Transaction[] } = {};
  const now = new Date();

  expenses.forEach(expense => {
    const date = new Date(expense.date);
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
    groups[group].push(expense);
  });

  // Sort groups: Today, Yesterday, Last Week, Last Month, then months descending
  const order = ['Today', 'Yesterday', 'Last Week', 'Last Month'];
  const monthGroups = Object.keys(groups).filter(g => !order.includes(g)).sort((a, b) => new Date(b + ' 1').getTime() - new Date(a + ' 1').getTime());
  const sortedKeys = [...order.filter(g => groups[g]), ...monthGroups];
  return sortedKeys.map(key => ({ label: key, items: groups[key] }));
}

export function ExpenseList({ expenses, onEdit, compact = false }: ExpenseListProps) {
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
    if (selectedItems.size === expenses.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(expenses.map(item => item.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return
    if (confirm(`Are you sure you want to delete ${selectedItems.size} selected expense record${selectedItems.size > 1 ? 's' : ''}?`)) {
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
        return <Badge variant="outline" className="text-green-600 border-green-600">Paid</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>
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

  const handleDelete = (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteTransaction(expenseId)
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No expense records found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start by adding your first expense entry.
        </p>
      </div>
    )
  }

  if (compact) {
    const grouped = groupExpensesByDate(expenses);
    return (
      <div className="space-y-4">
        {grouped.map(group => (
          <div key={group.label}>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{group.label}</div>
            <div className="space-y-3">
              {group.items.map((expenseItem) => (
                <div key={expenseItem.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedItems.has(expenseItem.id)}
                      onCheckedChange={() => toggleSelect(expenseItem.id)}
                      className="mr-2"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(expenseItem.category) }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{expenseItem.title}</p>
                      <p className="text-sm text-gray-500">
                        {getCategoryName(expenseItem.category)} • {format(new Date(expenseItem.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{expenseItem.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      {expenseItem.currency !== "INR" && (
                        <span className="block text-xs text-gray-500">
                          ({expenseItem.currency} {expenseItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                        </span>
                      )}
                      {getStatusBadge(expenseItem.status)}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(expenseItem)}
                        className="h-8 w-8 text-gray-500 hover:text-gray-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expenseItem.id)}
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
  const grouped = groupExpensesByDate(expenses);
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
                  checked={selectedItems.size === expenses.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map(group => [
              <TableRow key={group.label}>
                <TableCell colSpan={8} className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase py-2">{group.label}</TableCell>
              </TableRow>,
              ...group.items.map((expenseItem) => (
                <TableRow key={expenseItem.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(expenseItem.id)}
                      onCheckedChange={() => toggleSelect(expenseItem.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{expenseItem.title}</p>
                      {expenseItem.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {expenseItem.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(expenseItem.category) }}
                      />
                      <span>{getCategoryName(expenseItem.category)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-red-600">
                      {expenseItem.currency} {expenseItem.amount.toFixed(2)}
                    </span>
                    {expenseItem.currency !== "INR" && (
                      <span className="block text-xs text-gray-500">
                        ({expenseItem.currency} {expenseItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(expenseItem.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {expenseItem.vendor || '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(expenseItem.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(expenseItem)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expenseItem.id)}
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