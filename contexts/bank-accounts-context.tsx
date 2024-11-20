"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useWorkspace } from "@/contexts/workspace-context"
import { v4 as uuidv4 } from 'uuid'

export interface BankAccount {
  id: string
  name: string
  bankName: string
  accountNumber: string
  accountName: string
  swiftCode?: string
  ifscCode?: string
  routingNumber?: string
  isDefault?: boolean
  workspaceId: string
}

interface BankAccountsContextType {
  bankAccounts: BankAccount[]
  addBankAccount: (account: Omit<BankAccount, 'id'>) => void
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void
  deleteBankAccount: (id: string) => void
  setDefaultBankAccount: (id: string) => void
  getDefaultBankAccount: (workspaceId: string) => BankAccount | undefined
  getWorkspaceBankAccounts: (workspaceId: string) => BankAccount[]
}

const BankAccountsContext = createContext<BankAccountsContextType>({
  bankAccounts: [],
  addBankAccount: () => {},
  updateBankAccount: () => {},
  deleteBankAccount: () => {},
  setDefaultBankAccount: () => {},
  getDefaultBankAccount: () => undefined,
  getWorkspaceBankAccounts: () => [],
})

export function BankAccountsProvider({ children }: { children: React.ReactNode }) {
  const { currentWorkspace } = useWorkspace()
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bank_accounts')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts', JSON.stringify(bankAccounts))
  }, [bankAccounts])

  const addBankAccount = (account: Omit<BankAccount, 'id'>) => {
    const newAccount = {
      ...account,
      id: uuidv4(),
      isDefault: account.isDefault ?? bankAccounts.length === 0,
    }
    setBankAccounts(prev => [...prev, newAccount])
    return newAccount
  }

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    setBankAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, ...updates } : account
    ))
  }

  const deleteBankAccount = (id: string) => {
    setBankAccounts(prev => prev.filter(account => account.id !== id))
  }

  const setDefaultBankAccount = (id: string) => {
    setBankAccounts(prev => prev.map(account => ({
      ...account,
      isDefault: account.id === id
    })))
  }

  const getDefaultBankAccount = (workspaceId: string) => {
    return bankAccounts.find(account => 
      account.workspaceId === workspaceId && account.isDefault
    )
  }

  const getWorkspaceBankAccounts = (workspaceId: string) => {
    return bankAccounts.filter(account => account.workspaceId === workspaceId)
  }

  return (
    <BankAccountsContext.Provider value={{
      bankAccounts,
      addBankAccount,
      updateBankAccount,
      deleteBankAccount,
      setDefaultBankAccount,
      getDefaultBankAccount,
      getWorkspaceBankAccounts,
    }}>
      {children}
    </BankAccountsContext.Provider>
  )
}

export const useBankAccounts = () => useContext(BankAccountsContext) 