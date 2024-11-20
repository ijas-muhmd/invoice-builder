import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface CustomField {
  id: string
  label: string
  enabled: boolean
}

interface CustomizeFieldsModalProps {
  onToggleField: (fieldId: string, enabled: boolean) => void
  activeFields: string[]
}

export function CustomizeFieldsModal({ onToggleField, activeFields }: CustomizeFieldsModalProps) {
  const availableFields: CustomField[] = [
    { id: "gst", label: "GST Number", enabled: false },
    { id: "taxId", label: "Tax ID", enabled: false },
    { id: "vatNumber", label: "VAT Number", enabled: false },
    { id: "customerId", label: "Customer ID", enabled: false },
    { id: "referenceNumber", label: "Reference Number", enabled: false },
    { id: "projectCode", label: "Project Code", enabled: false },
    { id: "bankDetails", label: "Bank Account Details", enabled: false },
    { id: "termsAndConditions", label: "Terms & Conditions", enabled: false },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-4">
          <Settings className="w-4 h-4 mr-2" />
          Customize Fields
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Invoice Fields</DialogTitle>
          <DialogDescription>
            Enable or disable additional fields for your invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid gap-4 py-4">
          {availableFields.map((field) => (
            <div key={field.id} className="flex items-center justify-between space-x-2">
              <Label htmlFor={field.id} className="flex flex-col space-y-1">
                <span>{field.label}</span>
              </Label>
              <Switch
                id={field.id}
                checked={activeFields.includes(field.id)}
                onCheckedChange={(checked) => onToggleField(field.id, checked)}
              />
            </div>
          ))}
        </div>
        <div className="p-4 border-t text-center text-sm text-muted-foreground mt-auto">
          <p>Made with ❤️ by Invoice Maker <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">FREE</span></p>
          <p className="text-xs mt-1">
            <a 
              href="https://invoicemakerfree.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              invoicemakerfree.com
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
