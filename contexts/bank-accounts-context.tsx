"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useWorkspace } from "@/contexts/workspace-context"
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { useFinancial } from "@/contexts/financial-context"

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
  balance?: number
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
  const { transactions } = useFinancial()
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  // Load bank accounts from IndexedDB on mount
  useEffect(() => {
    const loadBankAccounts = async () => {
      const saved = await db.getAll('bank_accounts')
      if (saved) {
        setBankAccounts(saved)
    }
    }
    loadBankAccounts()
  }, [])

  // Save bank accounts to IndexedDB when they change
  useEffect(() => {
    const saveBankAccounts = async () => {
      if (bankAccounts.length > 0) {
        await Promise.all(bankAccounts.map(account => 
          db.set('bank_accounts', account.id, account)
        ))
      }
    }
    saveBankAccounts()
  }, [bankAccounts])

  // Update account balances when transactions change
  useEffect(() => {
    const updateBalances = async () => {
      const updatedAccounts = bankAccounts.map(account => {
        const accountTransactions = transactions.filter(t => t.paymentMethodId === account.id);
        const balance = accountTransactions.reduce((sum, t) => {
          const amount = t.baseCurrencyAmount ?? t.amount;
          return sum + (t.type === 'income' ? amount : -amount);
        }, account.balance ?? 0);

        return { ...account, balance };
      });

      setBankAccounts(updatedAccounts);
    };

    updateBalances();
  }, [transactions]);

  const addBankAccount = (account: Omit<BankAccount, 'id'>) => {
    const newAccount = {
      ...account,
      id: uuidv4(),
      isDefault: account.isDefault ?? bankAccounts.length === 0,
      balance: account.balance ?? 0,
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