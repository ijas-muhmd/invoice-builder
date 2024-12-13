"use client"

import { useState, useMemo, useEffect } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  VisibilityState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { type Invoice } from "@/contexts/invoice-context"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Settings2, Trash2, Check, X, ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { Filter, CalendarIcon } from "lucide-react"
import { addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "react-hot-toast"
import { useWorkspace } from "@/contexts/workspace-context"

interface InvoiceListProps {
  invoices: Invoice[]
  onDelete: (ids: string[]) => void
  onUpdate?: (id: string, updates: Partial<Invoice>) => void
}

interface Filters {
  status: string
  dateRange: DateRange | undefined
  amountRange: [number, number]
  customer: string
}

export function InvoiceList({ invoices: allInvoices, onDelete, onUpdate }: InvoiceListProps) {
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlStatus = searchParams.get('status')
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({
    status: urlStatus || "all",
    dateRange: undefined as DateRange | undefined,
    amountRange: [0, 10000] as [number, number],
    customer: "all"
  })

  useEffect(() => {
    if (urlStatus) {
      setFilters(prev => ({ ...prev, status: urlStatus }))
    }
  }, [urlStatus])

  const getCurrencySymbol = (currency: string = 'EUR') => {
    switch (currency) {
      case 'USD':
        return '$'
      case 'GBP':
        return '£'
      case 'EUR':
      default:
        return '€'
    }
  }

  const currencySymbol = getCurrencySymbol()

  const calculateInvoiceTotal = (invoice: Invoice) => {
    const subtotal = invoice.items.reduce((sum, item) => 
      sum + (item.quantity * item.rate), 0
    )
    const taxAmount = subtotal * (invoice.tax / 100)
    return subtotal + taxAmount + invoice.shipping - invoice.discount
  }

  const maxAmount = useMemo(() => {
    return Math.max(...allInvoices.map(invoice => calculateInvoiceTotal(invoice)), 10000)
  }, [allInvoices])

  const workspaceInvoices = useMemo(() => {
    return currentWorkspace 
      ? allInvoices.filter(inv => inv.workspaceId === currentWorkspace.id)
      : []
  }, [allInvoices, currentWorkspace])

  const filteredInvoices = useMemo(() => {
    return workspaceInvoices.filter(invoice => {
      const matchesSearch = 
        invoice.number.toLowerCase().includes(search.toLowerCase()) ||
        invoice.to.businessName.toLowerCase().includes(search.toLowerCase()) ||
        invoice.status.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = filters.status === "all" || invoice.status === filters.status

      const matchesDate = !filters.dateRange || (
        filters.dateRange.from && filters.dateRange.to && 
        isWithinInterval(new Date(invoice.date), {
          start: startOfDay(filters.dateRange.from),
          end: endOfDay(filters.dateRange.to)
        })
      )

      const invoiceAmount = calculateInvoiceTotal(invoice)
      const matchesAmount = invoiceAmount >= filters.amountRange[0] && 
                          invoiceAmount <= filters.amountRange[1]

      const matchesCustomer = filters.customer === "all" || 
                            invoice.to.businessName === filters.customer

      return matchesSearch && matchesStatus && matchesDate && 
             matchesAmount && matchesCustomer
    })
  }, [workspaceInvoices, search, filters])

  const columns = useMemo<ColumnDef<Invoice>[]>(() => [
    {
      id: "select",
      size: 40,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "number",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-left font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Invoice Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-left font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.getValue("date")), "PP"),
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-left font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.getValue("dueDate")), "PP"),
    },
    {
      accessorKey: "to.businessName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-left font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={getStatusColor(status)}>
            {status.toUpperCase()}
          </Badge>
        )
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const invoice = row.original
        const total = calculateInvoiceTotal(invoice)
        const symbol = invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : ''
        return <div className="text-right">{symbol}{total.toFixed(2)}</div>
      },
    },
  ], [])

  const table = useReactTable({
    data: filteredInvoices,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  useEffect(() => {
    const selectedRows = Object.keys(rowSelection).filter(key => rowSelection[key])
    setSelectedIds(selectedRows)
  }, [rowSelection])

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

  const customers = useMemo(() => {
    const unique = new Set(allInvoices.map(inv => inv.to.businessName))
    return Array.from(unique)
  }, [allInvoices])

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              {filteredInvoices.length} of {allInvoices.length} invoices
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[200px]"
            />

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {(filters.dateRange || filters.customer !== "all" || filters.status !== "all" || 
                    filters.amountRange[0] > 0 || filters.amountRange[1] < maxAmount) && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>
                    Filter your invoices by various criteria
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-6 py-6">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={filters.status} 
                      onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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

                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateRange?.from ? (
                              filters.dateRange.to ? (
                                <>
                                  {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                                  {format(filters.dateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(filters.dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={filters.dateRange?.from}
                            selected={filters.dateRange}
                            onSelect={(range) => setFilters(f => ({ ...f, dateRange: range }))}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                      {filters.dateRange && (
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => setFilters(f => ({ ...f, dateRange: undefined }))}
                        >
                          Clear dates
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount Range</Label>
                    <div className="pt-2">
                      <Slider
                        min={0}
                        max={maxAmount}
                        step={100}
                        value={filters.amountRange}
                        onValueChange={(value) => setFilters(f => ({ ...f, amountRange: value as [number, number] }))}
                      />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>{currencySymbol}{filters.amountRange[0]}</span>
                        <span>{currencySymbol}{filters.amountRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select 
                      value={filters.customer}
                      onValueChange={(value) => setFilters(f => ({ ...f, customer: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        {customers.map(customer => (
                          <SelectItem key={customer} value={customer || "unknown"}>
                            {customer || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => {
                        // toast({
                        //   title: "Filters applied",
                        //   description: "The invoice list has been updated.",
                        // })
                        toast.success("The invoice list has been updated.")
                      }}
                      className="w-full"
                    >
                      Apply Filters
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        const defaultFilters = {
                          status: "all",
                          dateRange: undefined,
                          amountRange: [0, maxAmount] as [number, number],
                          customer: "all"
                        }
                        setFilters(defaultFilters)
                        // toast({
                        //   title: "Filters reset",
                        //   description: "All filters have been cleared.",
                        // })
                        toast.success("All filters have been cleared.")
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/([A-Z])/g, ' $1').trim()}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="card-elevated">
        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow>
                {table.getHeaderGroups()[0].headers.map(header => (
                  <TableHead 
                    key={header.id}
                    className="w-auto first:w-[40px] last:w-[120px]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group relative cursor-pointer"
                    onClick={() => router.push(`/invoice/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell 
                        key={cell.id}
                        className="w-auto first:w-[40px] last:w-[120px]"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                    <div className="absolute inset-y-0 right-0 w-[100px] bg-gradient-to-l from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Are you sure you want to delete this invoice?')) {
                            onDelete([row.original.id])
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Invoices</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} selected invoice{selectedIds.length === 1 ? '' : 's'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(selectedIds)
                setSelectedIds([])
                setShowDeleteDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 