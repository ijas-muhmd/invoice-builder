"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  FileText, 
  Users, 
  Building, 
  CreditCard, 
  TrendingUp, 
  Receipt, 
  Settings,
  Tags,
  Palette,
  Download,
  Upload
} from "lucide-react"
import { useInvoices } from "@/contexts/invoice-context"
import { useBusinessDetails } from "@/contexts/business-details-context"
import { useCustomers } from "@/contexts/customer-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { useFinancial } from "@/contexts/financial-context"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { ExpenseForm } from "@/components/expense-form"
import { IncomeForm } from "@/components/income-form"
import { CategoryManagementDialog } from "./category-management-dialog"
import { PreferencesDialog } from "@/components/preferences-dialog"

interface FloatingActionOption {
  id: string
  label: string
  description: string
  icon: any
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "secondary" | "success" | "warning"
}

export function FloatingActionButton() {
  const router = useRouter()
  const pathname = usePathname()
  const { addInvoice, getDraft, clearDraft } = useInvoices()
  const { addCustomer } = useCustomers()
  const { currentWorkspace } = useWorkspace()
  
  // States for different dialogs
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showIncomeDialog, setShowIncomeDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferencesTab, setPreferencesTab] = useState<{category?: string, item?: string}>({})
  
  // Refs for managing hover delays
  const openTimeoutRef = useRef<NodeJS.Timeout>()
  const closeTimeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = undefined
    }
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = undefined
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 300)
  }

  // Determine the current app context
  const isFinancialApp = pathname.startsWith('/expenses')
  const isInvoiceApp = pathname === '/' || pathname.startsWith('/invoice')

  // Action handlers
  const handleCreateNewInvoice = async () => {
    if (isCreating) return
    setIsCreating(true)
    setIsOpen(false)
    
    try {
      const currentDraft = await getDraft()
      if (currentDraft && pathname === '/') {
        await addInvoice(currentDraft, 'draft')
        clearDraft()
      }
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

  const handleAddExpense = () => {
    setIsOpen(false)
    setShowExpenseDialog(true)
  }

  const handleAddIncome = () => {
    setIsOpen(false)
    setShowIncomeDialog(true)
  }

  const handleManageCategories = () => {
    setIsOpen(false)
    setShowCategoryDialog(true)
  }

  const handleBusinessProfile = () => {
    setIsOpen(false)
    setPreferencesTab({ category: "Business", item: "Business Profiles" })
    setShowPreferences(true)
  }

  const handleBankAccount = () => {
    setIsOpen(false)
    setPreferencesTab({ category: "Banking", item: "Bank Accounts" })
    setShowPreferences(true)
  }

  const handlePreferences = () => {
    setIsOpen(false)
    setShowPreferences(true)
  }

  const handleImportData = () => {
    setIsOpen(false)
    // TODO: Implement import functionality
    toast({
      title: "Import Data",
      description: "Import functionality will be implemented soon",
    })
  }

  const handleExportData = () => {
    setIsOpen(false)
    // TODO: Implement export functionality
    toast({
      title: "Export Data",
      description: "Export functionality will be implemented soon",
    })
  }

  // Build options based on current app context
  const getAddOptions = (): FloatingActionOption[] => {
    const commonOptions: FloatingActionOption[] = [
      {
        id: 'preferences',
        label: 'Preferences',
        description: 'App settings and configuration',
        icon: Settings,
        onClick: handlePreferences,
      }
    ]

    if (isFinancialApp) {
      return [
        {
          id: 'income',
          label: 'Add Income',
          description: 'Record new income entry',
          icon: TrendingUp,
          onClick: handleAddIncome,
          variant: "success"
        },
        {
          id: 'expense',
          label: 'Add Expense',
          description: 'Record new expense entry',
          icon: Receipt,
          onClick: handleAddExpense,
          variant: "warning"
        },
        {
          id: 'category',
          label: 'Manage Categories',
          description: 'Add or edit categories',
          icon: Tags,
          onClick: handleManageCategories,
        },
        ...commonOptions,
        {
          id: 'import',
          label: 'Import Data',
          description: 'Import financial data',
          icon: Upload,
          onClick: handleImportData,
        },
        {
          id: 'export',
          label: 'Export Data',
          description: 'Export financial data',
          icon: Download,
          onClick: handleExportData,
        }
      ]
    }

    if (isInvoiceApp) {
      return [
        {
          id: 'invoice',
          label: 'New Invoice',
          description: 'Create a new invoice',
          icon: FileText,
          onClick: handleCreateNewInvoice,
          disabled: isCreating,
          variant: "success"
        },
        {
          id: 'customer',
          label: 'New Customer',
          description: 'Add a new customer',
          icon: Users,
          onClick: handleAddCustomer,
        },
        {
          id: 'business',
          label: 'Business Profile',
          description: 'Manage business details',
          icon: Building,
          onClick: handleBusinessProfile,
        },
        {
          id: 'bank',
          label: 'Bank Account',
          description: 'Add bank account',
          icon: CreditCard,
          onClick: handleBankAccount,
        },
        ...commonOptions
      ]
    }

    return commonOptions
  }

  const addOptions = getAddOptions()

  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case "success":
        return "text-green-600 hover:text-green-700 hover:bg-green-50"
      case "warning":
        return "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
      case "secondary":
        return "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      default:
        return "text-muted-foreground hover:text-foreground"
    }
  }

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
            {addOptions.map((option, index) => (
              <div key={option.id}>
                <DropdownMenuItem
                  onClick={option.onClick}
                  disabled={option.disabled}
                  className={`flex items-start space-x-3 p-3 cursor-pointer ${getVariantClasses(option.variant)}`}
                >
                  <option.icon className="h-5 w-5 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-70">{option.description}</div>
                  </div>
                </DropdownMenuItem>
                {/* Add separator before preferences */}
                {option.id === 'category' && index < addOptions.length - 1 && (
                  <DropdownMenuSeparator />
                )}
                {option.id === 'bank' && index < addOptions.length - 1 && (
                  <DropdownMenuSeparator />
                )}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Customer Creation Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer profile for your invoices.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            onSubmit={(data) => {
              addCustomer({
                ...data,
                workspaceId: currentWorkspace?.id || 'default'
              })
              setShowCustomerDialog(false)
              toast({
                title: "Customer added",
                description: "New customer has been added successfully.",
              })
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Expense Creation Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Record a new business expense entry.
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            onSuccess={() => {
              setShowExpenseDialog(false)
              toast({
                title: "Expense added",
                description: "New expense has been recorded successfully.",
              })
            }}
            onCancel={() => setShowExpenseDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Income Creation Dialog */}
      <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Income</DialogTitle>
            <DialogDescription>
              Record a new income entry.
            </DialogDescription>
          </DialogHeader>
          <IncomeForm
            onSuccess={() => {
              setShowIncomeDialog(false)
              toast({
                title: "Income added",
                description: "New income has been recorded successfully.",
              })
            }}
            onCancel={() => setShowIncomeDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <CategoryManagementDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
      />

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