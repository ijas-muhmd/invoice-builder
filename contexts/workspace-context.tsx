"use client"

import { createContext, useContext, useEffect, useState } from "react"

export interface BusinessDetails {
  name: string
  email: string
  address: string
  phone: string
  taxNumber: string
  postalCode: string
  logo?: string
}

export interface Workspace {
  id: string
  name: string
  businessDetails: BusinessDetails
  createdAt: string
  isPersonal?: boolean
  logo?: string
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  addWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt'>) => void
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void
  deleteWorkspace: (id: string) => void
  setCurrentWorkspace: (id: string) => void
  updateBusinessDetails: (id: string, details: BusinessDetails) => void
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  currentWorkspace: null,
  addWorkspace: () => {},
  updateWorkspace: () => {},
  deleteWorkspace: () => {},
  setCurrentWorkspace: () => {},
  updateBusinessDetails: () => {},
})

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('workspaces')
      if (saved) {
        return JSON.parse(saved)
      }
      // Create default personal workspace
      const defaultWorkspace: Workspace = {
        id: crypto.randomUUID(),
        name: 'Personal Workspace',
        isPersonal: true,
        businessDetails: {
          name: '',
          email: '',
          address: '',
          phone: '',
          taxNumber: '',
          postalCode: '',
          logo: '',
        },
        createdAt: new Date().toISOString(),
      }
      return [defaultWorkspace]
    }
    return []
  })

  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(() => {
    if (typeof window !== 'undefined') {
      const currentId = localStorage.getItem('currentWorkspace')
      if (currentId && workspaces.length) {
        return workspaces.find(w => w.id === currentId) || workspaces[0]
      }
      return workspaces[0]
    }
    return null
  })

  useEffect(() => {
    localStorage.setItem('workspaces', JSON.stringify(workspaces))
  }, [workspaces])

  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('currentWorkspace', currentWorkspace.id)
    }
  }, [currentWorkspace])

  const addWorkspace = (workspace: Omit<Workspace, 'id' | 'createdAt'>) => {
    const newWorkspace: Workspace = {
      ...workspace,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setWorkspaces(prev => [...prev, newWorkspace])
    setCurrentWorkspace(newWorkspace)
  }

  const updateWorkspace = (id: string, updates: Partial<Workspace>) => {
    setWorkspaces(prev => prev.map(workspace => 
      workspace.id === id ? { ...workspace, ...updates } : workspace
    ))
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(prev => prev ? { ...prev, ...updates } : prev)
    }
  }

  const updateBusinessDetails = (id: string, details: BusinessDetails) => {
    setWorkspaces(prev => prev.map(workspace => 
      workspace.id === id 
        ? { ...workspace, businessDetails: details }
        : workspace
    ))
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(prev => prev 
        ? { ...prev, businessDetails: details }
        : prev
      )
    }
  }

  const deleteWorkspace = (id: string) => {
    setWorkspaces(prev => prev.filter(workspace => workspace.id !== id))
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(workspaces[0])
    }
  }

  const handleSetCurrentWorkspace = (id: string) => {
    const workspace = workspaces.find(w => w.id === id)
    if (workspace) {
      setCurrentWorkspace(workspace)
    }
  }

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      addWorkspace,
      updateWorkspace,
      deleteWorkspace,
      setCurrentWorkspace: handleSetCurrentWorkspace,
      updateBusinessDetails,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => useContext(WorkspaceContext) 