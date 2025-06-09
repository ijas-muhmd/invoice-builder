"use client"

import React, { createContext, useContext, useReducer, useEffect } from 'react'

export interface Transaction {
  id: string
  title: string
  amount: number
  currency: string
  category: string
  date: string
  description?: string
  vendor?: string
  customer?: string
  receipt?: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  tags?: string[]
  type: 'expense' | 'income'
  invoiceId?: string // Link to invoice if created from invoice payment
  createdAt: string
  updatedAt: string
}

// Keep the old interface for backward compatibility
export interface Expense extends Omit<Transaction, 'type' | 'customer'> {
  type?: 'expense'
}

export interface Income extends Omit<Transaction, 'type' | 'vendor'> {
  type: 'income'
}

export interface Category {
  id: string
  name: string
  color: string
  description?: string
  type: 'expense' | 'income' | 'both'
}

// Keep the old interface for backward compatibility
export interface ExpenseCategory extends Omit<Category, 'type'> {
  type?: 'expense' | 'both'
}

interface FinancialState {
  transactions: Transaction[]
  categories: Category[]
  totalExpenses: number
  totalIncome: number
  monthlyExpenses: number
  monthlyIncome: number
  netIncome: number
  monthlyNetIncome: number
  loading: boolean
}

type FinancialAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }

const defaultCategories: Category[] = [
  // Expense Categories
  { id: 'office', name: 'Office Supplies', color: '#3b82f6', description: 'Office equipment and supplies', type: 'expense' },
  { id: 'travel', name: 'Travel', color: '#10b981', description: 'Business travel expenses', type: 'expense' },
  { id: 'meals', name: 'Meals & Entertainment', color: '#f59e0b', description: 'Business meals and entertainment', type: 'expense' },
  { id: 'software', name: 'Software & Tools', color: '#8b5cf6', description: 'Software subscriptions and tools', type: 'expense' },
  { id: 'marketing', name: 'Marketing', color: '#ef4444', description: 'Marketing and advertising expenses', type: 'expense' },
  { id: 'training', name: 'Training & Education', color: '#06b6d4', description: 'Professional development', type: 'expense' },
  { id: 'utilities', name: 'Utilities', color: '#84cc16', description: 'Internet, phone, utilities', type: 'expense' },
  { id: 'other-expense', name: 'Other Expenses', color: '#6b7280', description: 'Miscellaneous expenses', type: 'expense' },
  
  // Income Categories
  { id: 'sales', name: 'Sales Revenue', color: '#22c55e', description: 'Revenue from sales and services', type: 'income' },
  { id: 'consulting', name: 'Consulting', color: '#3b82f6', description: 'Consulting and professional services', type: 'income' },
  { id: 'freelance', name: 'Freelance Work', color: '#8b5cf6', description: 'Freelance projects and contracts', type: 'income' },
  { id: 'investment', name: 'Investment Returns', color: '#10b981', description: 'Investment gains and dividends', type: 'income' },
  { id: 'rental', name: 'Rental Income', color: '#f59e0b', description: 'Property rental income', type: 'income' },
  { id: 'other-income', name: 'Other Income', color: '#06b6d4', description: 'Miscellaneous income', type: 'income' },
]

const initialState: FinancialState = {
  transactions: [],
  categories: defaultCategories,
  totalExpenses: 0,
  totalIncome: 0,
  monthlyExpenses: 0,
  monthlyIncome: 0,
  netIncome: 0,
  monthlyNetIncome: 0,
  loading: false,
}

function financialReducer(state: FinancialState, action: FinancialAction): FinancialState {
  switch (action.type) {
    case 'SET_EXPENSES':
      return {
        ...state,
        expenses: action.payload,
        totalExpenses: action.payload.reduce((sum, expense) => sum + expense.amount, 0),
        monthlyTotal: action.payload
          .filter(expense => {
            const expenseDate = new Date(expense.date)
            const now = new Date()
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear()
          })
          .reduce((sum, expense) => sum + expense.amount, 0)
      }
    case 'ADD_EXPENSE':
      const newExpenses = [...state.expenses, action.payload]
      return {
        ...state,
        expenses: newExpenses,
        totalExpenses: newExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        monthlyTotal: newExpenses
          .filter(expense => {
            const expenseDate = new Date(expense.date)
            const now = new Date()
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear()
          })
          .reduce((sum, expense) => sum + expense.amount, 0)
      }
    case 'UPDATE_EXPENSE':
      const updatedExpenses = state.expenses.map(expense =>
        expense.id === action.payload.id ? action.payload : expense
      )
      return {
        ...state,
        expenses: updatedExpenses,
        totalExpenses: updatedExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        monthlyTotal: updatedExpenses
          .filter(expense => {
            const expenseDate = new Date(expense.date)
            const now = new Date()
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear()
          })
          .reduce((sum, expense) => sum + expense.amount, 0)
      }
    case 'DELETE_EXPENSE':
      const filteredExpenses = state.expenses.filter(expense => expense.id !== action.payload)
      return {
        ...state,
        expenses: filteredExpenses,
        totalExpenses: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        monthlyTotal: filteredExpenses
          .filter(expense => {
            const expenseDate = new Date(expense.date)
            const now = new Date()
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear()
          })
          .reduce((sum, expense) => sum + expense.amount, 0)
      }
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload }
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] }
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        )
      }
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload)
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

interface ExpenseContextType extends ExpenseState {
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  addCategory: (category: Omit<ExpenseCategory, 'id'>) => void
  updateCategory: (category: ExpenseCategory) => void
  deleteCategory: (id: string) => void
  getExpensesByCategory: (categoryId: string) => Expense[]
  getExpensesByDateRange: (startDate: string, endDate: string) => Expense[]
  getExpensesByStatus: (status: Expense['status']) => Expense[]
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined)

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses')
    const savedCategories = localStorage.getItem('expense-categories')
    
    if (savedExpenses) {
      try {
        const expenses = JSON.parse(savedExpenses)
        dispatch({ type: 'SET_EXPENSES', payload: expenses })
      } catch (error) {
        console.error('Failed to load expenses from localStorage:', error)
      }
    }

    if (savedCategories) {
      try {
        const categories = JSON.parse(savedCategories)
        dispatch({ type: 'SET_CATEGORIES', payload: categories })
      } catch (error) {
        console.error('Failed to load categories from localStorage:', error)
      }
    }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(state.expenses))
  }, [state.expenses])

  useEffect(() => {
    localStorage.setItem('expense-categories', JSON.stringify(state.categories))
  }, [state.categories])

  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const expense: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_EXPENSE', payload: expense })
  }

  const updateExpense = (expense: Expense) => {
    const updatedExpense = {
      ...expense,
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'UPDATE_EXPENSE', payload: updatedExpense })
  }

  const deleteExpense = (id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: id })
  }

  const addCategory = (categoryData: Omit<ExpenseCategory, 'id'>) => {
    const category: ExpenseCategory = {
      ...categoryData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    dispatch({ type: 'ADD_CATEGORY', payload: category })
  }

  const updateCategory = (category: ExpenseCategory) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category })
  }

  const deleteCategory = (id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id })
  }

  const getExpensesByCategory = (categoryId: string) => {
    return state.expenses.filter(expense => expense.category === categoryId)
  }

  const getExpensesByDateRange = (startDate: string, endDate: string) => {
    return state.expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return expenseDate >= start && expenseDate <= end
    })
  }

  const getExpensesByStatus = (status: Expense['status']) => {
    return state.expenses.filter(expense => expense.status === status)
  }

  const value: ExpenseContextType = {
    ...state,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    getExpensesByCategory,
    getExpensesByDateRange,
    getExpensesByStatus,
  }

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  )
}

export function useExpenses() {
  const context = useContext(ExpenseContext)
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider')
  }
  return context
} 