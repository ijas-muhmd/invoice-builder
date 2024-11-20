"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useWorkspace } from "./workspace-context"

export interface Business {
  id: string
  workspaceId: string
  name: string
  email: string
  address: string
  phone: string
  taxNumber: string
  postalCode: string
  logo?: string
  isDefault?: boolean
  createdAt: string
}

interface BusinessContextType {
  businesses: Business[]
  addBusiness: (business: Omit<Business, 'id' | 'createdAt'>) => void
  updateBusiness: (id: string, updates: Partial<Business>) => void
  deleteBusiness: (id: string) => void
  getWorkspaceBusinesses: (workspaceId: string) => Business[]
  setDefaultBusiness: (id: string) => void
  getDefaultBusiness: (workspaceId: string) => Business | undefined
}

const BusinessContext = createContext<BusinessContextType>({
  businesses: [],
  addBusiness: () => {},
  updateBusiness: () => {},
  deleteBusiness: () => {},
  getWorkspaceBusinesses: () => [],
  setDefaultBusiness: () => {},
  getDefaultBusiness: () => undefined,
})

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { currentWorkspace } = useWorkspace()
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('businesses')
      console.log('Loading businesses from storage:', saved)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // Save businesses to localStorage whenever they change
  useEffect(() => {
    if (businesses.length > 0) {
      console.log('Saving businesses to storage:', businesses)
      localStorage.setItem('businesses', JSON.stringify(businesses))
    }
  }, [businesses])

  const addBusiness = (businessData: Omit<Business, 'id' | 'createdAt'>) => {
    if (!currentWorkspace) return

    const newBusiness: Business = {
      ...businessData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      workspaceId: currentWorkspace.id,
      isDefault: businesses.filter(b => b.workspaceId === currentWorkspace.id).length === 0, // Make first business default
    }

    setBusinesses(prev => [...prev, newBusiness])
    console.log('Added business:', newBusiness)
    return newBusiness
  }

  const updateBusiness = (id: string, updates: Partial<Business>) => {
    setBusinesses(prev => prev.map(business => 
      business.id === id ? { ...business, ...updates } : business
    ))
  }

  const deleteBusiness = (id: string) => {
    setBusinesses(prev => {
      const business = prev.find(b => b.id === id)
      if (!business) return prev

      const filtered = prev.filter(b => b.id !== id)
      
      // If deleted business was default, make another one default
      if (business.isDefault) {
        const nextDefault = filtered.find(b => b.workspaceId === business.workspaceId)
        if (nextDefault) {
          nextDefault.isDefault = true
        }
      }

      return filtered
    })
  }

  const getWorkspaceBusinesses = (workspaceId: string) => {
    return businesses.filter(business => business.workspaceId === workspaceId)
  }

  const setDefaultBusiness = (id: string) => {
    setBusinesses(prev => {
      const business = prev.find(b => b.id === id)
      if (!business) return prev

      return prev.map(b => ({
        ...b,
        isDefault: b.workspaceId === business.workspaceId ? b.id === id : b.isDefault
      }))
    })
  }

  const getDefaultBusiness = (workspaceId: string) => {
    return businesses.find(b => b.workspaceId === workspaceId && b.isDefault)
  }

  return (
    <BusinessContext.Provider value={{
      businesses,
      addBusiness,
      updateBusiness,
      deleteBusiness,
      getWorkspaceBusinesses,
      setDefaultBusiness,
      getDefaultBusiness,
    }}>
      {children}
    </BusinessContext.Provider>
  )
}

export const useBusiness = () => useContext(BusinessContext) 