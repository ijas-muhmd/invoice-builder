"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, StarOff, Pencil, Trash2 } from "lucide-react"
import { useBankAccounts, type BankAccount } from "@/contexts/bank-accounts-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { EmptyState } from "@/components/empty-state"
import { Building2 } from "lucide-react"

export function BankAccountsManagement() {
  const { currentWorkspace } = useWorkspace()
  const { 
    addBankAccount, 
    updateBankAccount, 
    deleteBankAccount, 
    setDefaultBankAccount, 
    getWorkspaceBankAccounts 
  } = useBankAccounts()
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null)
  const [showForm, setShowForm] = useState(false)

  const workspaceAccounts = currentWorkspace 
    ? getWorkspaceBankAccounts(currentWorkspace.id)
    : []

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentWorkspace) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive"
      })
      return
    }

    const formData = new FormData(e.currentTarget)
    const accountData = {
      name: formData.get('name') as string,
      bankName: formData.get('bankName') as string,
      accountNumber: formData.get('accountNumber') as string,
      accountName: formData.get('accountName') as string,
      swiftCode: formData.get('swiftCode') as string,
      ifscCode: formData.get('ifscCode') as string,
      routingNumber: formData.get('routingNumber') as string,
      workspaceId: currentWorkspace.id,
      isDefault: workspaceAccounts.length === 0,
    }

    try {
      if (editAccount) {
        updateBankAccount(editAccount.id, accountData)
        toast({
          title: "Bank account updated",
          description: "Your bank account details have been updated.",
        })
      } else {
        addBankAccount(accountData)
        toast({
          title: "Bank account added",
          description: "New bank account has been added.",
        })
      }

      setShowForm(false)
      setEditAccount(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save bank account details",
        variant: "destructive"
      })
    }
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                onClick={() => {
                  setShowForm(false)
                  setEditAccount(null)
                }}
              >
                Bank Accounts
              </Button>
              <span className="mx-2">/</span>
              <span className="text-foreground">
                {editAccount ? "Edit Account" : "New Account"}
              </span>
            </div>
            <h2 className="text-2xl font-semibold">
              {editAccount ? "Edit Bank Account" : "Add Bank Account"}
            </h2>
          </div>
          <Button 
            variant="outline"
            onClick={() => {
              setShowForm(false)
              setEditAccount(null)
            }}
          >
            Back to List
          </Button>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Account Label *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editAccount?.name}
                    required
                    placeholder="e.g., Main Business Account"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    defaultValue={editAccount?.bankName}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    defaultValue={editAccount?.accountNumber}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    name="accountName"
                    defaultValue={editAccount?.accountName}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="swiftCode">SWIFT Code</Label>
                  <Input
                    id="swiftCode"
                    name="swiftCode"
                    defaultValue={editAccount?.swiftCode}
                  />
                </div>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    name="ifscCode"
                    defaultValue={editAccount?.ifscCode}
                  />
                </div>
                <div>
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    name="routingNumber"
                    defaultValue={editAccount?.routingNumber}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditAccount(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editAccount ? "Update Account" : "Add Account"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    )
  }

  if (workspaceAccounts.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No bank accounts"
        description="Add your first bank account"
        action={{
          label: "Add Bank Account",
          onClick: () => setShowForm(true)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Bank Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Manage your bank accounts
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          Add Bank Account
        </Button>
      </div>

      <div className="grid gap-4">
        {workspaceAccounts.map((account) => (
          <Card key={account.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{account.name}</h3>
                  {account.isDefault && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {account.bankName} - {account.accountNumber}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDefaultBankAccount(account.id)}
                  disabled={account.isDefault}
                  title={account.isDefault ? "Default account" : "Set as default"}
                >
                  {account.isDefault ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditAccount(account)
                    setShowForm(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this bank account?')) {
                      deleteBankAccount(account.id)
                      toast({
                        title: "Bank account deleted",
                        description: "The bank account has been removed.",
                      })
                    }
                  }}
                  disabled={workspaceAccounts.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 