"use client"

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useMemo } from 'react'
import { useWorkspace } from './workspace-context'
import { db } from '../lib/db'
import { currencyService as rawCurrencyService } from '@/lib/currency-service'
import { useInvoices } from './invoice-context'
import { useCurrency } from '@/hooks/use-currency'
import { PaymentMethod } from '@/lib/db'

interface InvoiceItem {
  quantity: number
  unitPrice: number
  description?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  currency: string
  conversionRate?: number
  items: InvoiceItem[]
  customer?: {
    name: string
    email: string
    address?: string
  }
  notes?: string
  workspaceId: string
  createdAt: string
  updatedAt: string
}

interface CurrencyService {
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => Promise<{ convertedAmount: number }>
  getRate: (fromCurrency: string, toCurrency: string) => Promise<number>
}

export interface Transaction {
  id: string
  title: string
  amount: number
  currency: string
  inrAmount: number
  conversionRate?: number
  category: string
  date: string
  description?: string
  vendor?: string
  customer?: string
  receipt?: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  tags?: string[]
  type: 'expense' | 'income'
  invoiceId?: string
  paymentMethodId?: string
  workspaceId: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  description?: string
  type: 'expense' | 'income'
  workspaceId: string
}

interface FinancialState {
  transactions: Transaction[]
  expenseCategories: Category[]
  incomeCategories: Category[]
  totalExpenses: number
  totalIncome: number
  monthlyExpenses: number
  monthlyIncome: number
  netIncome: number
  monthlyNetIncome: number
  loading: boolean
  paymentMethods: PaymentMethod[]
  includePending: boolean
}

type FinancialAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_EXPENSE_CATEGORIES'; payload: Category[] }
  | { type: 'SET_INCOME_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_EXPENSE_CATEGORY'; payload: Category }
  | { type: 'ADD_INCOME_CATEGORY'; payload: Category }
  | { type: 'UPDATE_EXPENSE_CATEGORY'; payload: Category }
  | { type: 'UPDATE_INCOME_CATEGORY'; payload: Category }
  | { type: 'DELETE_EXPENSE_CATEGORY'; payload: string }
  | { type: 'DELETE_INCOME_CATEGORY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'UPDATE_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'DELETE_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_INCLUDE_PENDING'; payload: boolean }

const defaultExpenseCategories: Omit<Category, 'id' | 'workspaceId'>[] = [
  { name: 'Office Supplies', color: '#3b82f6', description: 'Office equipment and supplies', type: 'expense' },
  { name: 'Travel', color: '#10b981', description: 'Business travel expenses', type: 'expense' },
  { name: 'Meals & Entertainment', color: '#f59e0b', description: 'Business meals and entertainment', type: 'expense' },
  { name: 'Software & Tools', color: '#8b5cf6', description: 'Software subscriptions and tools', type: 'expense' },
  { name: 'Marketing', color: '#ef4444', description: 'Marketing and advertising expenses', type: 'expense' },
  { name: 'Training & Education', color: '#06b6d4', description: 'Professional development', type: 'expense' },
  { name: 'Utilities', color: '#84cc16', description: 'Internet, phone, utilities', type: 'expense' },
  { name: 'Legal & Professional', color: '#f97316', description: 'Legal and professional services', type: 'expense' },
]

const defaultIncomeCategories: Omit<Category, 'id' | 'workspaceId'>[] = [
  { name: 'Sales Revenue', color: '#22c55e', description: 'Revenue from sales and services', type: 'income' },
  { name: 'Consulting', color: '#3b82f6', description: 'Consulting and professional services', type: 'income' },
  { name: 'Freelance Work', color: '#8b5cf6', description: 'Freelance projects and contracts', type: 'income' },
  { name: 'Investment Returns', color: '#10b981', description: 'Investment gains and dividends', type: 'income' },
  { name: 'Rental Income', color: '#f59e0b', description: 'Property rental income', type: 'income' },
  { name: 'Other Income', color: '#06b6d4', description: 'Miscellaneous income', type: 'income' },
]

const calculateTotals = (transactions: Transaction[], includePending = false) => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Filter transactions by status - include paid (and optionally pending)
  const validTransactions = transactions.filter(t => t.status === 'paid' || (includePending && t.status === 'pending'))
  const expenses = validTransactions.filter(t => t.type === 'expense')
  const income = validTransactions.filter(t => t.type === 'income')

  const totalExpenses = expenses.reduce((sum, t) => sum + t.inrAmount, 0)
  const totalIncome = income.reduce((sum, t) => sum + t.inrAmount, 0)

  // Improved monthly calculations with proper date handling
  const monthlyExpenses = expenses
    .filter(t => {
      const date = new Date(t.date)
      // Use UTC to avoid timezone issues
      return date.getUTCMonth() === currentMonth && 
             date.getUTCFullYear() === currentYear
    })
    .reduce((sum, t) => sum + t.inrAmount, 0)

  const monthlyIncome = income
    .filter(t => {
      const date = new Date(t.date)
      // Use UTC to avoid timezone issues
      return date.getUTCMonth() === currentMonth && 
             date.getUTCFullYear() === currentYear
    })
    .reduce((sum, t) => sum + t.inrAmount, 0)

  return {
    totalExpenses,
    totalIncome,
    monthlyExpenses,
    monthlyIncome,
    netIncome: totalIncome - totalExpenses,
    monthlyNetIncome: monthlyIncome - monthlyExpenses
  }
}

function financialReducer(state: FinancialState, action: FinancialAction): FinancialState {
  switch (action.type) {
    case 'SET_TRANSACTIONS': {
      const totals = calculateTotals(action.payload, state.includePending)
      return {
        ...state,
        transactions: action.payload,
        ...totals
      }
    }
    case 'ADD_TRANSACTION': {
      const newTransactions = [...state.transactions, action.payload]
      const totals = calculateTotals(newTransactions, state.includePending)
      return {
        ...state,
        transactions: newTransactions,
        ...totals
      }
    }
    case 'UPDATE_TRANSACTION': {
      const updatedTransactions = state.transactions.map(t => 
        t.id === action.payload.id ? action.payload : t
      )
      const totals = calculateTotals(updatedTransactions, state.includePending)
      return {
        ...state,
        transactions: updatedTransactions,
        ...totals
      }
    }
    case 'DELETE_TRANSACTION': {
      const filteredTransactions = state.transactions.filter(t => t.id !== action.payload)
      const totals = calculateTotals(filteredTransactions, state.includePending)
      return {
        ...state,
        transactions: filteredTransactions,
        ...totals
      }
    }
    case 'SET_EXPENSE_CATEGORIES':
      return {
        ...state,
        expenseCategories: action.payload
      }
    case 'SET_INCOME_CATEGORIES':
      return {
        ...state,
        incomeCategories: action.payload
      }
    case 'ADD_EXPENSE_CATEGORY':
      return {
        ...state,
        expenseCategories: [...state.expenseCategories, action.payload]
      }
    case 'ADD_INCOME_CATEGORY':
      return {
        ...state,
        incomeCategories: [...state.incomeCategories, action.payload]
      }
    case 'UPDATE_EXPENSE_CATEGORY':
      return {
        ...state,
        expenseCategories: state.expenseCategories.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      }
    case 'UPDATE_INCOME_CATEGORY':
      return {
        ...state,
        incomeCategories: state.incomeCategories.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      }
    case 'DELETE_EXPENSE_CATEGORY':
      return {
        ...state,
        expenseCategories: state.expenseCategories.filter(c => c.id !== action.payload)
      }
    case 'DELETE_INCOME_CATEGORY':
      return {
        ...state,
        incomeCategories: state.incomeCategories.filter(c => c.id !== action.payload)
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    case 'SET_PAYMENT_METHODS':
      return {
        ...state,
        paymentMethods: action.payload
      }
    case 'ADD_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethods: [...state.paymentMethods, action.payload]
      }
    case 'UPDATE_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethods: state.paymentMethods.map(pm =>
          pm.id === action.payload.id ? action.payload : pm
        )
      }
    case 'DELETE_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethods: state.paymentMethods.filter(pm => pm.id !== action.payload)
      }
    case 'SET_INCLUDE_PENDING':
      return {
        ...state,
        includePending: action.payload,
        ...calculateTotals(state.transactions, action.payload)
      }
    default:
      return state
  }
}

const initialState: FinancialState = {
  transactions: [],
  expenseCategories: [],
  incomeCategories: [],
  totalExpenses: 0,
  totalIncome: 0,
  monthlyExpenses: 0,
  monthlyIncome: 0,
  netIncome: 0,
  monthlyNetIncome: 0,
  loading: true,
  paymentMethods: [],
  includePending: false,
}

interface FinancialContextType extends FinancialState {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'inrAmount'>) => void
  updateTransaction: (transaction: Transaction) => void
  deleteTransaction: (id: string) => void
  addExpenseCategory: (category: Omit<Category, 'id' | 'workspaceId'>) => void
  addIncomeCategory: (category: Omit<Category, 'id' | 'workspaceId'>) => void
  updateExpenseCategory: (category: Category) => void
  updateIncomeCategory: (category: Category) => void
  deleteExpenseCategory: (id: string) => void
  deleteIncomeCategory: (id: string) => void
  getTransactionsByCategory: (categoryId: string) => Transaction[]
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[]
  getTransactionsByStatus: (status: Transaction['status']) => Transaction[]
  getTransactionsByType: (type: 'expense' | 'income') => Transaction[]
  getExpenseCategories: () => Category[]
  getIncomeCategories: () => Category[]
  getAllCategories: () => Category[]
  getWorkspaceTransactions: (workspaceId: string) => Transaction[]
  getWorkspaceExpenseCategories: (workspaceId: string) => Category[]
  getWorkspaceIncomeCategories: (workspaceId: string) => Category[]
  convertTransactionAmounts: () => Promise<void>
  getTotalInBaseCurrency: (transactions: Transaction[]) => number
  formatTransactionAmount: (transaction: Transaction, showBoth?: boolean) => { original: string; converted?: string }
  // Legacy methods for backward compatibility
  addExpense: (expense: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'workspaceId'>) => void
  updateExpense: (expense: Transaction) => void
  deleteExpense: (id: string) => void
  addCategory: (category: Omit<Category, 'id' | 'workspaceId'>) => void
  updateCategory: (category: Category) => void
  deleteCategory: (id: string) => void
  addIncome: (income: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'workspaceId'>) => void
  createTransactionFromInvoice: (invoiceData: {
    invoiceId: string
    invoiceNumber: string
    amount: number
    currency: string
    date: string
    customer?: string
    description?: string
    conversionRate?: number
  }) => void
  includePending: boolean
  setIncludePending: (value: boolean) => void
  transactionsMissingConversion: Transaction[]
  addPaymentMethod: (paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>) => void
  updatePaymentMethod: (paymentMethod: PaymentMethod) => void
  deletePaymentMethod: (id: string) => void
  getPaymentMethods: () => PaymentMethod[]
  getPaymentMethod: (id: string) => PaymentMethod | undefined
  getPaymentMethodsByType: (type: PaymentMethod['type']) => PaymentMethod[]
  getPaymentMethodsByWorkspace: (workspaceId: string) => PaymentMethod[]
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined)

// Migration function to move localStorage data to workspace-based IndexedDB
const migrateLegacyData = async (workspaceId: string) => {
  try {
    // Check if we've already migrated for this workspace
    const migrationKey = `financial_migration_${workspaceId}`
    const alreadyMigrated = localStorage.getItem(migrationKey)
    if (alreadyMigrated) return

    // Migrate transactions
    const savedTransactions = localStorage.getItem('financial-transactions')
    if (savedTransactions) {
      const transactions = JSON.parse(savedTransactions)
      const migratedTransactions: Transaction[] = transactions.map((t: any) => ({
        ...t,
        workspaceId: workspaceId
      }))
      
      await Promise.all(migratedTransactions.map((transaction: Transaction) => 
        db.set('financial_transactions', transaction.id, transaction)
      ))
    }

    // Migrate expense categories
    const savedExpenseCategories = localStorage.getItem('financial-expense-categories')
    if (savedExpenseCategories) {
      const categories = JSON.parse(savedExpenseCategories)
      const migratedCategories = categories.map((c: any) => ({
        ...c,
        workspaceId: workspaceId
      }))
      
      await Promise.all(migratedCategories.map((category: Category) => 
        db.set('financial_expense_categories', category.id, category)
      ))
    }

    // Migrate income categories
    const savedIncomeCategories = localStorage.getItem('financial-income-categories')
    if (savedIncomeCategories) {
      const categories = JSON.parse(savedIncomeCategories)
      const migratedCategories = categories.map((c: any) => ({
        ...c,
        workspaceId: workspaceId
      }))
      
      await Promise.all(migratedCategories.map((category: Category) => 
        db.set('financial_income_categories', category.id, category)
      ))
    }

    // Mark as migrated and clean up localStorage
    localStorage.setItem(migrationKey, 'true')
    localStorage.removeItem('financial-transactions')
    localStorage.removeItem('financial-expense-categories')
    localStorage.removeItem('financial-income-categories')
    
    console.log('Successfully migrated legacy financial data to workspace:', workspaceId)
  } catch (error) {
    console.error('Failed to migrate legacy financial data:', error)
  }
}

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { currentWorkspace } = useWorkspace()
  const [state, dispatch] = useReducer(financialReducer, initialState)
  const { invoices } = useInvoices()
  const { settings: currencySettings, refreshRates } = useCurrency()
  const [transactionsMissingConversion, setTransactionsMissingConversion] = useState<Transaction[]>([])

  // Load workspace data
  useEffect(() => {
    if (currentWorkspace) {
      loadWorkspaceData()
    }
  }, [currentWorkspace])

  const loadWorkspaceData = async () => {
    if (!currentWorkspace) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load transactions
      const transactions = await db.getAll('financial_transactions');
      const workspaceTransactions = transactions
        .filter((t: any) => t.workspaceId === currentWorkspace.id)
        .map((t: any) => ({
          ...t,
          inrAmount: typeof t.inrAmount === 'number' ? t.inrAmount : (t.currency === 'INR' ? t.amount : (t.amount * (t.conversionRate || 1)))
        }))
        .filter((t: any) => typeof t.inrAmount === 'number' && !isNaN(t.inrAmount)) as Transaction[]
      
      // Calculate totals using inrAmount
      const totalExpenses = workspaceTransactions
        .filter(t => t.type === 'expense' && (t.status === 'paid' || state.includePending))
        .reduce((sum, t) => sum + t.inrAmount, 0);

      const totalIncome = workspaceTransactions
        .filter(t => t.type === 'income' && (t.status === 'paid' || state.includePending))
        .reduce((sum, t) => sum + t.inrAmount, 0);

      const netIncome = totalIncome - totalExpenses;

      // Calculate monthly totals
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyExpenses = workspaceTransactions
        .filter(t => 
          t.type === 'expense' && 
          (t.status === 'paid' || state.includePending) &&
          new Date(t.date) >= firstDayOfMonth &&
          new Date(t.date) <= lastDayOfMonth
        )
        .reduce((sum, t) => sum + t.inrAmount, 0);

      const monthlyIncome = workspaceTransactions
        .filter(t => 
          t.type === 'income' && 
          (t.status === 'paid' || state.includePending) &&
          new Date(t.date) >= firstDayOfMonth &&
          new Date(t.date) <= lastDayOfMonth
        )
        .reduce((sum, t) => sum + t.inrAmount, 0);

      const monthlyNetIncome = monthlyIncome - monthlyExpenses;

      dispatch({
        type: 'SET_TRANSACTIONS',
        payload: workspaceTransactions
      });

      // Load and ensure default expense categories
      const expenseCategories = await db.getAll('financial_expense_categories');
      const workspaceExpenseCategories = expenseCategories.filter((c: Category) => c.workspaceId === currentWorkspace.id);
      if (workspaceExpenseCategories.length === 0) {
        const defaultCategoriesToAdd = [
          { name: "Rent", color: "#EF4444", type: "expense" as const },
          { name: "Groceries", color: "#F97316", type: "expense" as const },
          { name: "Utilities", color: "#EAB308", type: "expense" as const },
          { name: "Salary", color: "#22C55E", type: "income" as const },
          { name: "Freelance", color: "#10B981", type: "income" as const },
        ];

        for (const category of defaultCategoriesToAdd) {
          if (category.type === 'expense' && !workspaceExpenseCategories.some(c => c.name === category.name)) {
            addExpenseCategory({ name: category.name, color: category.color, type: category.type });
          } else if (category.type === 'income' && !workspaceExpenseCategories.some(c => c.name === category.name)) {
            addIncomeCategory({ name: category.name, color: category.color, type: category.type });
          }
        }
      }
      const updatedExpenseCategories = await db.getAll('financial_expense_categories');
      const workspaceUpdatedExpenseCategories = updatedExpenseCategories.filter((c: Category) => c.workspaceId === currentWorkspace.id);
      dispatch({ type: 'SET_EXPENSE_CATEGORIES', payload: workspaceUpdatedExpenseCategories });

      // Load and ensure default income categories
      const incomeCategories = await db.getAll('financial_income_categories');
      const workspaceIncomeCategories = incomeCategories.filter((c: Category) => c.workspaceId === currentWorkspace.id);
      if (workspaceIncomeCategories.length === 0) {
        for (const cat of defaultIncomeCategories) {
          await db.set('financial_income_categories', `${currentWorkspace.id}_${cat.name}`, { ...cat, id: `${currentWorkspace.id}_${cat.name}`, workspaceId: currentWorkspace.id });
        }
      }
      const updatedIncomeCategories = await db.getAll('financial_income_categories');
      const workspaceUpdatedIncomeCategories = updatedIncomeCategories.filter((c: Category) => c.workspaceId === currentWorkspace.id);
      dispatch({ type: 'SET_INCOME_CATEGORIES', payload: workspaceUpdatedIncomeCategories });

      // Load and ensure default payment methods
      const allPaymentMethods = await db.getAll('payment_methods')
      const workspacePaymentMethods = allPaymentMethods.filter((pm: PaymentMethod) => pm.workspaceId === currentWorkspace.id)
      
      // If no payment methods exist, check localStorage for legacy data
      if (workspacePaymentMethods.length === 0) {
        const savedPaymentMethods = localStorage.getItem('financial-payment-methods')
        if (savedPaymentMethods) {
          const paymentMethods = JSON.parse(savedPaymentMethods)
          const migratedPaymentMethods = paymentMethods.map((pm: PaymentMethod) => ({
            ...pm,
            workspaceId: currentWorkspace.id,
            createdAt: pm.createdAt || new Date().toISOString(),
            updatedAt: pm.updatedAt || new Date().toISOString()
          }))
          
          await Promise.all(migratedPaymentMethods.map((paymentMethod: PaymentMethod) => 
            db.set('payment_methods', paymentMethod.id, paymentMethod)
          ))
          
          // Update the workspace payment methods after migration
          const updatedPaymentMethods = await db.getAll('payment_methods')
          const updatedWorkspacePaymentMethods = updatedPaymentMethods.filter((pm: PaymentMethod) => pm.workspaceId === currentWorkspace.id)
          dispatch({ type: 'SET_PAYMENT_METHODS', payload: updatedWorkspacePaymentMethods })
          
          // Clean up localStorage after successful migration
          localStorage.removeItem('financial-payment-methods')
        } else {
          dispatch({ type: 'SET_PAYMENT_METHODS', payload: [] })
        }
      } else {
        dispatch({ type: 'SET_PAYMENT_METHODS', payload: workspacePaymentMethods })
      }
    } catch (error) {
      console.error('Error loading workspace data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Save transactions to IndexedDB when they change
  useEffect(() => {
    const saveTransactions = async () => {
      if (state.transactions.length > 0) {
        await Promise.all(state.transactions.map(transaction => 
          db.set('financial_transactions', transaction.id, transaction)
        ))
      }
    }
    saveTransactions()
  }, [state.transactions])

  // Save expense categories to IndexedDB when they change
  useEffect(() => {
    const saveExpenseCategories = async () => {
      if (state.expenseCategories.length > 0) {
        await Promise.all(state.expenseCategories.map(category => 
          db.set('financial_expense_categories', category.id, category)
        ))
      }
    }
    saveExpenseCategories()
  }, [state.expenseCategories])

  // Save income categories to IndexedDB when they change
  useEffect(() => {
    const saveIncomeCategories = async () => {
      if (state.incomeCategories.length > 0) {
        await Promise.all(state.incomeCategories.map(category => 
          db.set('financial_income_categories', category.id, category)
        ))
      }
    }
    saveIncomeCategories()
  }, [state.incomeCategories])

  // Save payment methods to IndexedDB when they change
  useEffect(() => {
    const savePaymentMethods = async () => {
      if (state.paymentMethods.length > 0) {
        await Promise.all(state.paymentMethods.map(paymentMethod => 
          db.set('payment_methods', paymentMethod.id, paymentMethod)
        ))
      }
    }
    savePaymentMethods()
  }, [state.paymentMethods])

  const recalculateTotals = useCallback(async (invoices: Invoice[]) => {
    if (!currentWorkspace) return;

    // Helper function to calculate invoice total
    const calculateInvoiceTotal = (invoice: Invoice): number => {
      return invoice.items.reduce((total: number, item) => {
        const amount = item.quantity * item.unitPrice;
        return total + amount;
      }, 0);
    };

    // Get existing invoice transactions
    const existingInvoiceTransactions = state.transactions.filter(t => t.invoiceId);

    // Process invoices to create/update transactions
    const invoiceTransactions: Transaction[] = invoices
      .filter(invoice => invoice.status === 'paid' || invoice.status === 'sent')
      .map(invoice => {
        const existingTransaction = existingInvoiceTransactions.find(t => t.invoiceId === invoice.id);
        
        if (existingTransaction) {
          const newAmount = calculateInvoiceTotal(invoice);
          const newStatus = invoice.status === 'paid' ? 'paid' : 'pending';
          
          if (
            existingTransaction.amount !== newAmount ||
            existingTransaction.status !== newStatus ||
            existingTransaction.currency !== invoice.currency ||
            existingTransaction.title !== invoice.title
          ) {
            return {
              ...existingTransaction,
              amount: newAmount,
              status: newStatus,
              currency: invoice.currency,
              title: invoice.title,
              date: invoice.issueDate,
              customer: invoice.customer?.name || '',
              description: `Invoice #${invoice.invoiceNumber}`,
              category: 'invoice',
              invoiceId: invoice.id,
              updatedAt: new Date().toISOString(),
              inrAmount: invoice.currency === 'INR' ? newAmount : (newAmount * (invoice.conversionRate || 1))
            };
          }
          return existingTransaction;
        }

        const now = new Date().toISOString();
        const newAmount = calculateInvoiceTotal(invoice);
        return {
          id: `inv_${invoice.id}`,
          amount: newAmount,
          currency: invoice.currency,
          title: invoice.title,
          date: invoice.issueDate,
          customer: invoice.customer?.name || '',
          description: `Invoice #${invoice.invoiceNumber}`,
          category: 'invoice',
          status: invoice.status === 'paid' ? 'paid' : 'pending',
          type: 'income',
          invoiceId: invoice.id,
          workspaceId: currentWorkspace.id,
          createdAt: now,
          updatedAt: now,
          inrAmount: invoice.currency === 'INR' ? newAmount : (newAmount * (invoice.conversionRate || 1))
        };
      });

    // Remove transactions for invoices that no longer exist
    const keptTransactions = state.transactions.filter(t => {
      if (!t.invoiceId) return true; // Keep non-invoice transactions
      return invoices.some(inv => inv.id === t.invoiceId);
    });

    // Combine kept transactions with invoice transactions
    const updatedTransactions = [...keptTransactions, ...invoiceTransactions];

    // Convert all amounts to base currency and calculate totals
    const convertedTransactions = await Promise.all(updatedTransactions.map(async t => {
      try {
        const { convertedAmount, rate } = await rawCurrencyService.convertCurrency(t.amount, t.currency, 'INR');
        return {
          ...t,
          inrAmount: convertedAmount,
          conversionRate: rate
        };
      } catch (error) {
        console.error('Error converting transaction:', error);
        return {
          ...t,
          inrAmount: t.amount // Fallback to original amount if conversion fails
        };
      }
    }));

    const totalExpenses = convertedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.inrAmount, 0);

    const totalIncome = convertedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.inrAmount, 0);

    const netIncome = totalIncome - totalExpenses;

    // Only update state if there are actual changes
    const hasTransactionsChanged = JSON.stringify(state.transactions) !== JSON.stringify(updatedTransactions);
    const hasTotalsChanged = 
      state.totalExpenses !== totalExpenses ||
      state.totalIncome !== totalIncome ||
      state.netIncome !== netIncome;

    if (hasTransactionsChanged || hasTotalsChanged) {
      dispatch({
        type: 'SET_TRANSACTIONS',
        payload: updatedTransactions
      });
    }
  }, [currentWorkspace, state.transactions, state.totalExpenses, state.totalIncome, state.netIncome, dispatch]);

  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'inrAmount'>) => {
    if (!currentWorkspace) return

    const newTransaction: Transaction = {
      ...transactionData,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: currentWorkspace.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inrAmount: transactionData.currency === 'INR' ? transactionData.amount : 
        (transactionData.amount * (transactionData.conversionRate || 1))
    }
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction })
  }, [currentWorkspace, dispatch])

  const updateTransaction = useCallback((transaction: Transaction) => {
    const updatedTransaction = {
      ...transaction,
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction })
  }, [dispatch])

  const deleteTransaction = useCallback((id: string) => {
    // Remove from IndexedDB
    db.delete('financial_transactions', id)
    dispatch({ type: 'DELETE_TRANSACTION', payload: id })
  }, [dispatch])

  const addExpenseCategory = useCallback((categoryData: Omit<Category, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return

    const category: Category = {
      ...categoryData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: currentWorkspace.id,
      type: 'expense'
    }
    dispatch({ type: 'ADD_EXPENSE_CATEGORY', payload: category })
  }, [currentWorkspace, dispatch])

  const addIncomeCategory = useCallback((categoryData: Omit<Category, 'id' | 'workspaceId'>) => {
    if (!currentWorkspace) return

    const category: Category = {
      ...categoryData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: currentWorkspace.id,
      type: 'income'
    }
    dispatch({ type: 'ADD_INCOME_CATEGORY', payload: category })
  }, [currentWorkspace, dispatch])

  const updateExpenseCategory = useCallback((category: Category) => {
    dispatch({ type: 'UPDATE_EXPENSE_CATEGORY', payload: category })
  }, [dispatch])

  const updateIncomeCategory = useCallback((category: Category) => {
    dispatch({ type: 'UPDATE_INCOME_CATEGORY', payload: category })
  }, [dispatch])

  const deleteExpenseCategory = useCallback((id: string) => {
    // Remove from IndexedDB
    db.delete('financial_expense_categories', id)
    dispatch({ type: 'DELETE_EXPENSE_CATEGORY', payload: id })
  }, [dispatch])

  const deleteIncomeCategory = useCallback((id: string) => {
    // Remove from IndexedDB
    db.delete('financial_income_categories', id)
    dispatch({ type: 'DELETE_INCOME_CATEGORY', payload: id })
  }, [dispatch])

  // Legacy category management functions
  const addCategory = useCallback((categoryData: Omit<Category, 'id' | 'workspaceId'>) => {
    if (categoryData.type === 'expense') {
      addExpenseCategory(categoryData)
    } else if (categoryData.type === 'income') {
      addIncomeCategory(categoryData)
    }
  }, [addExpenseCategory, addIncomeCategory])

  const updateCategory = useCallback((category: Category) => {
    if (category.type === 'expense') {
      updateExpenseCategory(category)
    } else if (category.type === 'income') {
      updateIncomeCategory(category)
    }
  }, [updateExpenseCategory, updateIncomeCategory])

  const deleteCategory = useCallback((id: string) => {
    // Try to delete from both categories
    const expenseCategory = state.expenseCategories.find(cat => cat.id === id)
    const incomeCategory = state.incomeCategories.find(cat => cat.id === id)
    
    if (expenseCategory) {
      deleteExpenseCategory(id)
    } else if (incomeCategory) {
      deleteIncomeCategory(id)
    }
  }, [deleteExpenseCategory, deleteIncomeCategory])

  const getTransactionsByCategory = useCallback((categoryId: string) => {
    return state.transactions.filter(transaction => transaction.category === categoryId)
  }, [state.transactions])

  const getTransactionsByDateRange = useCallback((startDate: string, endDate: string) => {
    return state.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return transactionDate >= start && transactionDate <= end
    })
  }, [state.transactions])

  const getTransactionsByStatus = useCallback((status: Transaction['status']) => {
    return state.transactions.filter(transaction => transaction.status === status)
  }, [state.transactions])

  const getTransactionsByType = useCallback((type: 'expense' | 'income') => {
    return state.transactions.filter(transaction => transaction.type === type)
  }, [state.transactions])

  const getWorkspaceTransactions = useCallback((workspaceId: string) => {
    return state.transactions.filter(transaction => transaction.workspaceId === workspaceId)
  }, [state.transactions])

  const getWorkspaceExpenseCategories = useCallback((workspaceId: string) => {
    return state.expenseCategories.filter(category => category.workspaceId === workspaceId)
  }, [state.expenseCategories])

  const getWorkspaceIncomeCategories = useCallback((workspaceId: string) => {
    return state.incomeCategories.filter(category => category.workspaceId === workspaceId)
  }, [state.incomeCategories])

  const getExpenseCategories = useCallback(() => state.expenseCategories, [state.expenseCategories])
  const getIncomeCategories = useCallback(() => state.incomeCategories, [state.incomeCategories])
  const getAllCategories = useCallback(() => [...state.expenseCategories, ...state.incomeCategories], [state.expenseCategories, state.incomeCategories])

  // Legacy compatibility methods
  const addExpense = useCallback((expenseData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'workspaceId'>) => {
    addTransaction({ ...expenseData, type: 'expense' })
  }, [addTransaction])

  const addIncome = useCallback((incomeData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'workspaceId'>) => {
    addTransaction({ ...incomeData, type: 'income' })
  }, [addTransaction])

  const createTransactionFromInvoice = useCallback((invoiceData: {
    invoiceId: string
    invoiceNumber: string
    amount: number
    currency: string
    date: string
    customer?: string
    description?: string
    conversionRate?: number
  }) => {
    if (!currentWorkspace) return

    const transaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'income',
      amount: invoiceData.amount,
      currency: invoiceData.currency,
      date: invoiceData.date,
      title: `Invoice #${invoiceData.invoiceNumber}`,
      customer: invoiceData.customer || '',
      description: invoiceData.description || '',
      category: 'invoice',
      status: 'pending',
      workspaceId: currentWorkspace.id,
      invoiceId: invoiceData.invoiceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inrAmount: invoiceData.currency === 'INR' ? invoiceData.amount : 
        (invoiceData.amount * (invoiceData.conversionRate || 1))
    }

    dispatch({ type: 'ADD_TRANSACTION', payload: transaction })
  }, [currentWorkspace, dispatch])

  const addPaymentMethod = useCallback((paymentMethodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>) => {
    if (!currentWorkspace?.id) return;
    const newPaymentMethod: PaymentMethod = {
      id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: currentWorkspace.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...paymentMethodData,
    };
    console.log("Attempting to add payment method:", newPaymentMethod);
    db.set('payment_methods', newPaymentMethod.id, newPaymentMethod);
    dispatch({ type: 'ADD_PAYMENT_METHOD', payload: newPaymentMethod });
  }, [currentWorkspace?.id, dispatch]);

  const updatePaymentMethod = useCallback((paymentMethod: PaymentMethod) => {
    console.log("Attempting to update payment method:", paymentMethod);
    db.set('payment_methods', paymentMethod.id, paymentMethod);
    dispatch({ type: 'UPDATE_PAYMENT_METHOD', payload: paymentMethod });
  }, [dispatch]);

  const deletePaymentMethod = useCallback((id: string) => {
    db.delete('payment_methods', id);
    dispatch({ type: 'DELETE_PAYMENT_METHOD', payload: id });
  }, [dispatch]);

  const getPaymentMethods = useCallback(() => state.paymentMethods, [state.paymentMethods]);

  const convertTransactionAmounts = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    const transactionsToUpdate = state.transactions.filter(t => 
      typeof t.inrAmount !== 'number' || isNaN(t.inrAmount) || t.inrAmount === 0
    );

    if (transactionsToUpdate.length === 0) return;

    const updatedTransactions = await Promise.all(
      transactionsToUpdate.map(async (t) => {
        if (t.currency === 'INR') {
          return { ...t, inrAmount: t.amount };
        } else {
          const { convertedAmount, rate } = await rawCurrencyService.convertCurrency(t.amount, t.currency, 'INR');
          if (rate) {
            return { ...t, inrAmount: convertedAmount, conversionRate: rate };
          } else {
            console.warn(`Could not get conversion rate for ${t.currency}. Manual conversion needed for transaction ${t.id}`);
            return { ...t, inrAmount: 0 }; // Set to 0 if conversion fails, user needs to manually update
          }
        }
      })
    );

    dispatch({ type: 'SET_TRANSACTIONS', payload: updatedTransactions });
    // After conversion, filter out transactions that still have 0 or invalid inrAmount
    setTransactionsMissingConversion(updatedTransactions.filter(t => t.inrAmount === 0 || isNaN(t.inrAmount)));

  }, [state.transactions, currentWorkspace?.id]);

  // This effect ensures default categories are added only once per workspace
  useEffect(() => {
    const addDefaultsIfNeeded = async () => {
      if (currentWorkspace?.id && !state.loading && state.expenseCategories.length === 0) {
        for (const cat of defaultExpenseCategories) {
          await addExpenseCategory({ name: cat.name, color: cat.color, type: cat.type });
        }
      }
      if (currentWorkspace?.id && !state.loading && state.incomeCategories.length === 0) {
        for (const cat of defaultIncomeCategories) {
          await addIncomeCategory({ name: cat.name, color: cat.color, type: cat.type });
        }
      }
    }
    addDefaultsIfNeeded();
  }, [currentWorkspace?.id, state.loading, state.expenseCategories.length, state.incomeCategories.length, addExpenseCategory, addIncomeCategory]);

  const getTotalInBaseCurrency = useCallback((transactions: Transaction[]): number => {
    return transactions.reduce((sum, t) => sum + t.inrAmount, 0);
  }, []);

  const formatTransactionAmount = useCallback((transaction: Transaction, showBoth: boolean = false) => {
    const original = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: transaction.currency,
      minimumFractionDigits: 2,
    }).format(transaction.amount);

    if (showBoth && transaction.currency !== 'INR') {
      const converted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(transaction.inrAmount);
      return { original, converted };
    }
    return { original };
  }, []);

  // Legacy methods - kept for backward compatibility if older components still use them
  const expenses = state.transactions.filter(t => t.type === 'expense');
  const categories = state.expenseCategories; // Assuming main categories were expenses

  const monthlyTotal = state.monthlyExpenses; // For legacy monthly total

  const getPaymentMethod = useCallback((id: string) => {
    return state.paymentMethods.find(pm => pm.id === id);
  }, [state.paymentMethods]);

  const getPaymentMethodsByType = useCallback((type: PaymentMethod['type']) => {
    return state.paymentMethods.filter(pm => pm.type === type);
  }, [state.paymentMethods]);

  const getPaymentMethodsByWorkspace = useCallback((workspaceId: string) => {
    return state.paymentMethods.filter(pm => pm.workspaceId === workspaceId);
  }, [state.paymentMethods]);

  const [includePending, setIncludePending] = useState(false);

  const handleIncludePendingChange = (value: boolean) => {
    setIncludePending(value);
    dispatch({ type: 'SET_INCLUDE_PENDING', payload: value });
  };

  const contextValue = useMemo(() => ({
    ...state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addExpenseCategory,
    addIncomeCategory,
    updateExpenseCategory,
    updateIncomeCategory,
    deleteExpenseCategory,
    deleteIncomeCategory,
    getTransactionsByCategory,
    getTransactionsByDateRange,
    getTransactionsByStatus,
    getTransactionsByType,
    getExpenseCategories,
    getIncomeCategories,
    getAllCategories,
    getWorkspaceTransactions,
    getWorkspaceExpenseCategories,
    getWorkspaceIncomeCategories,
    convertTransactionAmounts,
    getTotalInBaseCurrency,
    formatTransactionAmount,
    expenses,
    categories,
    addExpense,
    addIncome,
    createTransactionFromInvoice,
    updateExpense: (expense: Transaction) => updateTransaction(expense),
    deleteExpense: (id: string) => deleteTransaction(id),
    addCategory,
    updateCategory,
    deleteCategory,
    monthlyTotal,
    includePending,
    setIncludePending: handleIncludePendingChange,
    transactionsMissingConversion,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getPaymentMethods,
    getPaymentMethod,
    getPaymentMethodsByType,
    getPaymentMethodsByWorkspace,
    refreshRates,
    currencySettings
  }), [
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addExpenseCategory,
    addIncomeCategory,
    updateExpenseCategory,
    updateIncomeCategory,
    deleteExpenseCategory,
    deleteIncomeCategory,
    getTransactionsByCategory,
    getTransactionsByDateRange,
    getTransactionsByStatus,
    getTransactionsByType,
    getExpenseCategories,
    getIncomeCategories,
    getAllCategories,
    getWorkspaceTransactions,
    getWorkspaceExpenseCategories,
    getWorkspaceIncomeCategories,
    convertTransactionAmounts,
    getTotalInBaseCurrency,
    formatTransactionAmount,
    expenses,
    categories,
    addExpense,
    addIncome,
    createTransactionFromInvoice,
    transactionsMissingConversion,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getPaymentMethods,
    getPaymentMethod,
    getPaymentMethodsByType,
    getPaymentMethodsByWorkspace,
    refreshRates,
    currencySettings
  ]);

  return (
    <FinancialContext.Provider value={contextValue}>
      {children}
    </FinancialContext.Provider>
  )
}

export function useFinancial() {
  const context = useContext(FinancialContext)
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider')
  }
  return context
}

// Legacy export for backward compatibility
export const useExpenses = useFinancial 