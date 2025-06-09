"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { db } from "@/lib/db"

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
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)

  // Load workspaces from IndexedDB on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      let savedWorkspaces = await db.getAll('workspaces')

      if (!savedWorkspaces || savedWorkspaces.length === 0) {
        // Create default personal workspace if none exist
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
        await db.set('workspaces', defaultWorkspace.id, defaultWorkspace)
        savedWorkspaces = [defaultWorkspace] // Ensure savedWorkspaces contains the newly created one
      }
      
      setWorkspaces(savedWorkspaces)
      
      // Set current workspace
      const currentId = await db.get('settings', 'currentWorkspace')
      if (currentId) {
        const workspace = savedWorkspaces.find((w: Workspace) => w.id === currentId)
        if (workspace) {
          setCurrentWorkspace(workspace)
        } else {
          // If currentId doesn't match an existing workspace, default to the first one
          setCurrentWorkspace(savedWorkspaces[0])
        }
      } else {
        // Default to the first workspace if no currentId is set
        setCurrentWorkspace(savedWorkspaces[0])
      }
    }
    loadWorkspaces()
  }, []) // Empty dependency array means this runs once on mount

  // Save workspaces to IndexedDB when they change
  useEffect(() => {
    const saveWorkspaces = async () => {
      if (workspaces.length > 0) {
        await Promise.all(workspaces.map(workspace => 
          db.set('workspaces', workspace.id, workspace)
        ))
      }
    }
    saveWorkspaces()
  }, [workspaces])

  // Save current workspace ID to IndexedDB when it changes
  useEffect(() => {
    const saveCurrentWorkspace = async () => {
    if (currentWorkspace) {
        await db.set('settings', 'currentWorkspace', currentWorkspace.id)
      }
    }
    saveCurrentWorkspace()
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

  const deleteWorkspace = async (id: string) => {
    setWorkspaces(prev => prev.filter(workspace => workspace.id !== id))
    await db.delete('workspaces', id)
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(prev => {
        const remaining = workspaces.filter(workspace => workspace.id !== id)
        return remaining.length > 0 ? remaining[0] : null
      })
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