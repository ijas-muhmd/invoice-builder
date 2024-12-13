"use client"

import { useState, useEffect } from "react"
import { useCustomers, type Customer } from "@/contexts/customer-context"
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
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react"
import { CustomerForm } from "@/components/customer-form"
import { toast } from "@/components/ui/use-toast"
import { EmptyState } from "@/components/empty-state"
import { Card } from "@/components/ui/card"
import { useWorkspace } from "@/contexts/workspace-context"

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers()
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

  if (!mounted) return null

  if (customers.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to get started"
          action={{
            label: "Add Customer",
            onClick: handleAddCustomer
          }}
        />
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
            Manage your customer list and their details
          </p>
        </div>
        <Button onClick={handleAddCustomer}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
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
              <TableHead>Added On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  {customer.businessName}
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone || "-"}</TableCell>
                <TableCell>
                  {format(new Date(customer.createdAt), "PP")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(customer)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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