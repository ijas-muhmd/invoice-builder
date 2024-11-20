"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useWorkspace } from "./workspace-context"

export interface Customer {
  id: string
  businessName: string
  email: string
  address: string
  phone?: string
  notes?: string
  createdAt: string
  workspaceId: string
}

interface CustomerContextType {
  customers: Customer[]
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  getWorkspaceCustomers: (workspaceId: string) => Customer[]
}

const CustomerContext = createContext<CustomerContextType>({
  customers: [],
  addCustomer: () => {},
  updateCustomer: () => {},
  deleteCustomer: () => {},
  getWorkspaceCustomers: () => [],
})

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { currentWorkspace } = useWorkspace()
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customers')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers))
  }, [customers])

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!currentWorkspace) return

    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      workspaceId: currentWorkspace.id,
    }
    setCustomers(prev => [...prev, newCustomer])
  }

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, ...updates } : customer
    ))
  }

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id))
  }

  const getWorkspaceCustomers = (workspaceId: string) => {
    return customers.filter(customer => customer.workspaceId === workspaceId)
  }

  return (
    <CustomerContext.Provider value={{
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      getWorkspaceCustomers,
    }}>
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomers = () => useContext(CustomerContext) 