"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Users, Building, CreditCard } from "lucide-react"
import { useInvoices } from "@/contexts/invoice-context"
import { useBusinessDetails } from "@/contexts/business-details-context"
import { useCustomers } from "@/contexts/customer-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { toast } from "@/components/ui/use-toast"
import type { InvoiceFormValues } from "@/app/invoice-schema"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CustomerForm } from "@/components/customer-form"
import { PreferencesDialog } from "@/components/preferences-dialog"

export function FloatingNewInvoiceButton() {
  const router = useRouter()
  const pathname = usePathname()
  const { addInvoice, getDraft, clearDraft } = useInvoices()
  const { businessDetails } = useBusinessDetails()
  const { addCustomer } = useCustomers()
  const { currentWorkspace } = useWorkspace()
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferencesTab, setPreferencesTab] = useState<{category?: string, item?: string}>({})
  
  // Refs for managing hover delays
  const openTimeoutRef = useRef<NodeJS.Timeout>()
  const closeTimeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = undefined
    }
    
    // Open immediately if not already open
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleMouseLeave = () => {
    // Clear any pending open timeout
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = undefined
    }
    
    // Close after a delay
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 300) // Increased delay to 300ms
  }

  const handleCreateNewInvoice = async () => {
    if (isCreating) return
    
    setIsCreating(true)
    setIsOpen(false)
    
    try {
      // Save any existing draft first
      const currentDraft = await getDraft()
      if (currentDraft && pathname === '/') {
        await addInvoice(currentDraft, 'draft')
        clearDraft()
      }

      // Simply navigate to the new invoice page - let it handle creation
      router.push('/')
      
      toast({
        title: "Creating new invoice",
        description: "Ready to create your new invoice",
      })
      
    } catch (error) {
      console.error('Error creating new invoice:', error)
      toast({
        title: "Error",
        description: "Failed to create new invoice. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddCustomer = () => {
    setIsOpen(false)
    setShowCustomerDialog(true)
  }

  const handleAddBusinessProfile = () => {
    setIsOpen(false)
    setPreferencesTab({ category: "Business", item: "Business Profiles" })
    setShowPreferences(true)
  }

  const handleAddBankAccount = () => {
    setIsOpen(false)
    setPreferencesTab({ category: "Banking", item: "Bank Accounts" })
    setShowPreferences(true)
  }

  const addOptions = [
    {
      id: 'invoice',
      label: 'New Invoice',
      description: 'Create a new invoice',
      icon: FileText,
      onClick: handleCreateNewInvoice,
      disabled: isCreating
    },
    {
      id: 'customer',
      label: 'New Customer',
      description: 'Add a new customer',
      icon: Users,
      onClick: handleAddCustomer,
      disabled: false
    },
    {
      id: 'business',
      label: 'Business Profile',
      description: 'Manage business details',
      icon: Building,
      onClick: handleAddBusinessProfile,
      disabled: false
    },
    {
      id: 'bank',
      label: 'Bank Account',
      description: 'Add bank account',
      icon: CreditCard,
      onClick: handleAddBankAccount,
      disabled: false
    }
  ]

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isCreating}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Plus className="w-5 h-5 mr-2" />
              {isCreating ? "Creating..." : "Add New"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            side="top" 
            className="w-64 mb-2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {addOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={option.onClick}
                disabled={option.disabled}
                className="flex items-start space-x-3 p-3 cursor-pointer"
              >
                <option.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Customer Creation Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
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
              setShowCustomerDialog(false)
              toast({
                title: "Customer added",
                description: "The customer has been added successfully.",
              })
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Preferences Dialog */}
      <PreferencesDialog 
        open={showPreferences} 
        onOpenChange={setShowPreferences}
        initialCategory={preferencesTab.category}
        initialItem={preferencesTab.item}
      />
    </>
  )
} 