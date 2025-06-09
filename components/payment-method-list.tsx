"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash, Banknote, CreditCard, Landmark, Mail, CircleHelp, Wallet, IndianRupee, Coins, Smartphone } from "lucide-react"
import { useFinancial } from "@/contexts/financial-context"
import { type PaymentMethod } from "@/lib/db"
import { PaymentMethodForm } from "./payment-method-form"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export function PaymentMethodList() {
  const { paymentMethods, deletePaymentMethod } = useFinancial()
  const [showForm, setShowForm] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | undefined>(undefined)

  const handleAddMethod = () => {
    setEditingMethod(undefined)
    setShowForm(true)
  }

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method)
    setShowForm(true)
  }

  const handleDeleteMethod = (id: string) => {
    try {
      deletePaymentMethod(id)
      toast({
        title: "Payment Method Deleted",
        description: "The payment method has been successfully removed.",
      })
    } catch (error) {
      console.error("Error deleting payment method:", error)
      toast({
        title: "Error",
        description: "Failed to delete payment method. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getIconForType = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'Bank Account':
        return <Landmark className="w-5 h-5 text-blue-600" />
      case 'Credit Card':
        return <CreditCard className="w-5 h-5 text-purple-600" />
      case 'Debit Card':
        return <CreditCard className="w-5 h-5 text-green-600" />
      case 'UPI':
        return <IndianRupee className="w-5 h-5 text-yellow-600" />
      case 'PayPal':
        return <Wallet className="w-5 h-5 text-indigo-600" />
      case 'Cash':
        return <Coins className="w-5 h-5 text-gray-600" />
      case 'Digital Wallet':
        return <Smartphone className="w-5 h-5 text-pink-600" />
      case 'Net Banking':
        return <Landmark className="w-5 h-5 text-orange-600" />
      case 'Other':
        return <CircleHelp className="w-5 h-5 text-gray-600" />
      default:
        return <Banknote className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeColor = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'Bank Account':
        return 'bg-blue-100 text-blue-800'
      case 'Credit Card':
        return 'bg-purple-100 text-purple-800'
      case 'Debit Card':
        return 'bg-green-100 text-green-800'
      case 'UPI':
        return 'bg-yellow-100 text-yellow-800'
      case 'PayPal':
        return 'bg-indigo-100 text-indigo-800'
      case 'Cash':
        return 'bg-gray-100 text-gray-800'
      case 'Digital Wallet':
        return 'bg-pink-100 text-pink-800'
      case 'Net Banking':
        return 'bg-orange-100 text-orange-800'
      case 'Other':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleAddMethod}>
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}</DialogTitle>
            </DialogHeader>
            <PaymentMethodForm
              paymentMethod={editingMethod}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Banknote className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No payment methods added yet.</p>
            <Button size="sm" onClick={handleAddMethod} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-md bg-white shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {getIconForType(method.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{method.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor(method.type)}>
                        {method.type}
                      </Badge>
                    </div>
                    {method.details && (
                      <p className="text-xs text-gray-500 mt-1">{method.details}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditMethod(method)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          payment method.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMethod(method.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 