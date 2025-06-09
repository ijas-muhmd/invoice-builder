"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCustomers, type Customer } from "@/contexts/customer-context"
import { useInvoices } from "@/contexts/invoice-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Plus, Search, Pencil, Trash2, Users, Eye, DollarSign } from "lucide-react"
import { CustomerForm } from "@/components/customer-form"
import { toast } from "@/components/ui/use-toast"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspace } from "@/contexts/workspace-context"
import { 
  calculateCustomerFinancialSummary, 
  formatCurrency,
  getAllCustomersFinancialSummary 
} from "@/lib/customer-financial-utils"
import { SampleDataLoader } from "@/components/sample-data-loader"

export default function CustomersPage() {
  const router = useRouter()
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers()
  const { invoices } = useInvoices()
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { currentWorkspace } = useWorkspace()

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredCustomers = customers.filter(customer => 
    customer.businessName.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase())
  )

  const customersFinancialData = getAllCustomersFinancialSummary(filteredCustomers, invoices)

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.businessName}?`)) {
      deleteCustomer(customer.id)
      toast({
        title: "Customer deleted",
        description: "The customer has been deleted successfully.",
      })
    }
  }

  const handleAddCustomer = () => {
    setShowAddDialog(true)
  }

  const handleViewCustomer = (customerId: string) => {
    router.push(`/customers/${customerId}`)
  }

  if (!mounted) return null

  if (customers.length === 0) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center gap-8">
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add your first customer to get started"
            action={{
              label: "Add Customer",
              onClick: handleAddCustomer
            }}
          />
          
          {/* Sample Data Loader for Testing */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-medium mb-4">Or try with sample data</h3>
            <SampleDataLoader />
          </div>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to your list
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              onSubmit={(data) => {
                const customerData = { ...data, workspaceId: currentWorkspace!.id }
                addCustomer(customerData)
                setShowAddDialog(false)
                toast({
                  title: "Customer added",
                  description: "The customer has been added successfully.",
                })
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-[1400px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer list and their financial details
          </p>
        </div>
        <Button onClick={handleAddCustomer}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                customersFinancialData.reduce((sum, customer) => sum + customer.totalIncome, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(
                customersFinancialData.reduce((sum, customer) => sum + customer.totalOutstanding, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="p-4 flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Total Income</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => {
              const financialData = customersFinancialData.find(data => data.customerId === customer.id)
              
              return (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {customer.businessName}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    {financialData ? formatCurrency(financialData.totalIncome, financialData.currency) : '€0.00'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={financialData?.totalOutstanding && financialData.totalOutstanding > 0 ? 'text-yellow-600' : 'text-green-600'}>
                      {financialData ? formatCurrency(financialData.totalOutstanding, financialData.currency) : '€0.00'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(customer.createdAt), "PP")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCustomer(customer.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(customer)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your list
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            onSubmit={(data) => {
              const customerData = { ...data, workspaceId: currentWorkspace!.id }
              addCustomer(customerData)
              setShowAddDialog(false)
              toast({
                title: "Customer added",
                description: "The customer has been added successfully.",
              })
            }}
          />
        </DialogContent>
      </Dialog>

      {selectedCustomer && (
        <Dialog open={true} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update customer details
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              defaultValues={selectedCustomer}
              submitLabel="Update Customer"
              onSubmit={(data) => {
                updateCustomer(selectedCustomer.id, data)
                setSelectedCustomer(null)
                toast({
                  title: "Customer updated",
                  description: "The customer has been updated successfully.",
                })
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 