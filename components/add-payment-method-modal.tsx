"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal
} from "@/components/ui/dialog"
import { PaymentMethodForm } from "@/components/payment-method-form"
import * as React from "react"

interface AddPaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPaymentMethodModal({ open, onOpenChange }: AddPaymentMethodModalProps) {
  return (
    <DialogPortal>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Payment Method</DialogTitle>
          </DialogHeader>
          <PaymentMethodForm
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    </DialogPortal>
  )
} 