"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCustomers } from "@/contexts/customer-context"
import { useInvoices } from "@/contexts/invoice-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Phone, MapPin, Plus } from "lucide-react"
import { CustomerFinancialSummaryComponent } from "@/components/customer-financial-summary"
import { CustomerInvoices } from "@/components/customer-invoices"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CustomerDetailPageProps {
  params: {
    id: string
  }
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const router = useRouter()
  const { customers } = useCustomers()
  const { invoices } = useInvoices()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const customer = customers.find(c => c.id === params.id)

  if (!mounted) return null

  if (!customer) {
    return (
      <div className="container mx-auto p-8 max-w-[1400px]">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Customer not found</h1>
          <Button onClick={() => router.push('/customers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </div>
    )
  }

  const handleCreateInvoice = () => {
    router.push(`/invoice/new?customerId=${customer.id}`)
  }

  return (
    <div className="container mx-auto p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/customers')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-3xl font-bold">{customer.businessName}</h1>
            <p className="text-muted-foreground">Customer Details & Financial Overview</p>
          </div>
        </div>
        <Button onClick={handleCreateInvoice}>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Customer Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>
            
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{customer.address}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Customer Since</p>
              <p className="font-medium">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {customer.notes && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-2">Notes</p>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CustomerFinancialSummaryComponent 
            customer={customer}
            invoices={invoices}
          />
        </TabsContent>

        <TabsContent value="invoices">
          <CustomerInvoices 
            customer={customer}
            invoices={invoices}
            onEdit={(invoiceId) => router.push(`/invoice/${invoiceId}`)}
            onView={(invoiceId) => router.push(`/invoice/${invoiceId}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 