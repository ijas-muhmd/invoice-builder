"use client"

import { Button } from "@/components/ui/button"
import { useBankAccounts } from "@/contexts/bank-accounts-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { type UseFormReturn } from "react-hook-form"
import { type InvoiceFormValues } from "@/app/invoice-schema"
import { BankAccountSelect } from "@/components/bank-account-select"
import { useEffect, useCallback } from "react"

interface BankAccountSelectFieldProps {
  form: UseFormReturn<InvoiceFormValues>
}

export function BankAccountSelectField({ form }: BankAccountSelectFieldProps) {
  const { currentWorkspace } = useWorkspace()
  const { getDefaultBankAccount, getWorkspaceBankAccounts } = useBankAccounts()

  const handleSelect = useCallback((account: any) => {
    if (!account) return;
    
    const formattedDetails = `Bank Name: ${account.bankName}
Account Name: ${account.accountName}
Account Number: ${account.accountNumber}
${account.swiftCode ? `SWIFT Code: ${account.swiftCode}` : ''}
${account.ifscCode ? `IFSC Code: ${account.ifscCode}` : ''}
${account.routingNumber ? `Routing Number: ${account.routingNumber}` : ''}`;

    form.setValue('bankDetails', formattedDetails, { shouldDirty: true });
  }, [form]);

  useEffect(() => {
    if (currentWorkspace) {
      const defaultAccount = getDefaultBankAccount(currentWorkspace.id);
      if (defaultAccount && !form.getValues('bankDetails')) {
        handleSelect(defaultAccount);
      }
    }
  }, [currentWorkspace, getDefaultBankAccount, handleSelect, form]);

  return (
    <div className="space-y-4">
      <BankAccountSelect
        value={form.watch('bankDetails')}
        onSelect={handleSelect}
      />
      <p className="text-sm text-muted-foreground">
        Select a bank account or enter details manually
      </p>
    </div>
  )
} 