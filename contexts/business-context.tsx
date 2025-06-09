"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useWorkspace } from "./workspace-context"
import { db } from "../lib/db"

export interface Business {
  id: string
  name: string
  email: string
  address: string
  phone?: string
  taxNumber?: string
  postalCode?: string
  logo?: string
  workspaceId: string
  isDefault: boolean
  registrationNumber?: string
  website?: string
  notes?: string
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
  const [businesses, setBusinesses] = useState<Business[]>([])

  // Load businesses from IndexedDB on mount
  useEffect(() => {
    const loadBusinesses = async () => {
      const saved = await db.getAll('businesses')
      if (saved) {
        setBusinesses(saved)
      }
    }
    loadBusinesses()
  }, [])

  // Save businesses to IndexedDB when they change
  useEffect(() => {
    const saveBusinesses = async () => {
    if (businesses.length > 0) {
        await Promise.all(businesses.map(business => 
          db.set('businesses', business.id, business)
        ))
    }
    }
    saveBusinesses()
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