"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useBusinessDetails } from "@/contexts/business-details-context"
import { toast } from "@/components/ui/use-toast"
import { Upload, Download, Shield } from "lucide-react"

export function DataPreferences() {
  const { businessDetails } = useBusinessDetails()
  const [pin, setPin] = useState(localStorage.getItem('app-pin') || '')

  const handleExportData = () => {
    const data = {
      businessDetails,
      invoices: localStorage.getItem('invoices'),
      customers: localStorage.getItem('customers'),
      preferences: localStorage.getItem('preferences'),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoicify-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Data exported",
      description: "Your data has been exported successfully.",
    })
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          
          // Import all data
          if (data.businessDetails) localStorage.setItem('defaultBusinessDetails', JSON.stringify(data.businessDetails))
          if (data.invoices) localStorage.setItem('invoices', data.invoices)
          if (data.customers) localStorage.setItem('customers', data.customers)
          if (data.preferences) localStorage.setItem('preferences', data.preferences)
          
          toast({
            title: "Data imported",
            description: "Your data has been imported successfully. Please refresh the page.",
          })
          
          // Refresh the page to load new data
          setTimeout(() => window.location.reload(), 2000)
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Failed to import data. Please check the file format.",
            variant: "destructive"
          })
        }
      }
      reader.readAsText(file)
    }
  }

  const handleSetPin = (newPin: string) => {
    if (newPin.length === 4) {
      localStorage.setItem('app-pin', newPin)
      setPin(newPin)
      toast({
        title: "PIN set",
        description: "Your PIN has been set successfully.",
      })
    }
  }

  const handleClearPin = () => {
    localStorage.removeItem('app-pin')
    setPin('')
    toast({
      title: "PIN removed",
      description: "Your PIN has been removed successfully.",
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Security PIN</Label>
            <p className="text-sm text-muted-foreground">
              Set a 4-digit PIN to protect your data
            </p>
          </div>
          {pin && (
            <Button variant="outline" onClick={handleClearPin}>
              Remove PIN
            </Button>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <Input
            type="password"
            placeholder="Enter 4-digit PIN"
            value={pin}
            onChange={(e) => handleSetPin(e.target.value)}
            maxLength={4}
            pattern="\d*"
            className="w-40"
          />
          <Shield className={`h-4 w-4 ${pin ? 'text-green-500' : 'text-muted-foreground'}`} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base">Export Data</Label>
          <p className="text-sm text-muted-foreground">
            Download all your data as a JSON file for backup
          </p>
        </div>
        <Button onClick={handleExportData} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Export All Data
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base">Import Data</Label>
          <p className="text-sm text-muted-foreground">
            Import data from a backup file
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild className="w-full">
            <label>
              <Upload className="mr-2 h-4 w-4" />
              Import Data
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
              />
            </label>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-destructive">Clear Data</Label>
        <p className="text-sm text-muted-foreground">
          Remove all data except business details
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">Clear All Data</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your invoices and customer data. Business details will be kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const businessDetails = localStorage.getItem('defaultBusinessDetails')
                  const pin = localStorage.getItem('app-pin')
                  localStorage.clear()
                  if (businessDetails) localStorage.setItem('defaultBusinessDetails', businessDetails)
                  if (pin) localStorage.setItem('app-pin', pin)
                  window.location.reload()
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
} 