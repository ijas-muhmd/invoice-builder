"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCustomers } from "@/contexts/customer-context"
import { useInvoices } from "@/contexts/invoice-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { createSampleData } from "@/lib/sample-data"
import { Database, CheckCircle, AlertCircle } from "lucide-react"

export function SampleDataLoader() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ customersAdded: number; invoicesAdded: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { addCustomer } = useCustomers()
  const { addInvoice } = useInvoices()
  const { currentWorkspace } = useWorkspace()

  const handleLoadSampleData = async () => {
    if (!currentWorkspace) {
      setError("No workspace selected")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const result = createSampleData(addCustomer, addInvoice, currentWorkspace.id)
      setResult(result)
    } catch (err) {
      setError("Failed to load sample data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Data
        </CardTitle>
        <CardDescription>
          Load sample customers and invoices for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleLoadSampleData} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Loading..." : "Load Sample Data"}
        </Button>
        
        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully added {result.customersAdded} customers and {result.invoicesAdded} invoices!
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 