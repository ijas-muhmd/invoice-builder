"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useWorkspace } from "./workspace-context"

export interface CustomField {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  placeholder?: string
  required?: boolean
  options?: string[] // For select type
  section: 'business' | 'customer' | 'invoice' | 'items' | 'custom'
}

export interface Template {
  id: string
  name: string
  workspaceId: string
  isDefault?: boolean
  customFields: CustomField[]
  itemColumns: {
    id: string
    label: string
    type: 'text' | 'number'
    required?: boolean
    show: boolean
  }[]
  sections: {
    id: string
    name: string
    show: boolean
    order: number
  }[]
  createdAt: string
}

interface TemplateContextType {
  templates: Template[]
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void
  updateTemplate: (id: string, updates: Partial<Template>) => void
  deleteTemplate: (id: string) => void
  getWorkspaceTemplates: (workspaceId: string) => Template[]
  setDefaultTemplate: (id: string) => void
  getDefaultTemplate: (workspaceId: string) => Template | undefined
  duplicateTemplate: (id: string) => void
}

const TemplateContext = createContext<TemplateContextType>({
  templates: [],
  addTemplate: () => {},
  updateTemplate: () => {},
  deleteTemplate: () => {},
  getWorkspaceTemplates: () => [],
  setDefaultTemplate: () => {},
  getDefaultTemplate: () => undefined,
  duplicateTemplate: () => {},
})

const standardTemplate: Omit<Template, 'id' | 'workspaceId' | 'createdAt'> = {
  name: "Standard Invoice Template",
  isDefault: true,
  customFields: [
    {
      id: "terms-net30",
      label: "Payment Terms",
      type: "text",
      section: "invoice",
      placeholder: "Net 30",
      required: false,
    },
    {
      id: "po-number",
      label: "PO Number",
      type: "text",
      section: "invoice",
      placeholder: "Purchase Order Number",
      required: false,
    }
  ],
  itemColumns: [
    { id: "description", label: "Description", type: "text", required: true, show: true },
    { id: "quantity", label: "Quantity", type: "number", required: true, show: true },
    { id: "rate", label: "Rate", type: "number", required: true, show: true },
    { id: "amount", label: "Amount", type: "number", required: true, show: true },
  ],
  sections: [
    { id: "logo", name: "Logo", show: true, order: 0 },
    { id: "title", name: "Invoice Title", show: true, order: 1 },
    { id: "business", name: "Business Details", show: true, order: 2 },
    { id: "customer", name: "Customer Details", show: true, order: 3 },
    { id: "dates", name: "Dates & Numbers", show: true, order: 4 },
    { id: "items", name: "Items", show: true, order: 5 },
    { id: "totals", name: "Totals", show: true, order: 6 },
    { id: "notes", name: "Notes", show: true, order: 7 },
    { id: "terms", name: "Terms", show: true, order: 8 },
  ],
}

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const { currentWorkspace } = useWorkspace()
  const [templates, setTemplates] = useState<Template[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('invoice-templates')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return []
  })

  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('invoice-templates', JSON.stringify(templates))
    }
  }, [templates])

  const addTemplate = (templateData: Omit<Template, 'id' | 'createdAt'>) => {
    if (!currentWorkspace) return

    const newTemplate: Template = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    setTemplates(prev => [...prev, newTemplate])
    return newTemplate
  }

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, ...updates } : template
    ))
  }

  const deleteTemplate = (id: string) => {
    setTemplates(prev => {
      const template = prev.find(t => t.id === id)
      if (!template) return prev

      const filtered = prev.filter(t => t.id !== id)
      
      // If deleted template was default, make another one default
      if (template.isDefault) {
        const nextDefault = filtered.find(t => t.workspaceId === template.workspaceId)
        if (nextDefault) {
          nextDefault.isDefault = true
        }
      }

      return filtered
    })
  }

  const getWorkspaceTemplates = (workspaceId: string) => {
    return templates.filter(template => template.workspaceId === workspaceId)
  }

  const setDefaultTemplate = (id: string) => {
    setTemplates(prev => {
      const template = prev.find(t => t.id === id)
      if (!template) return prev

      return prev.map(t => ({
        ...t,
        isDefault: t.workspaceId === template.workspaceId ? t.id === id : t.isDefault
      }))
    })
  }

  const getDefaultTemplate = (workspaceId: string) => {
    return templates.find(t => t.workspaceId === workspaceId && t.isDefault)
  }

  const duplicateTemplate = (id: string) => {
    const template = templates.find(t => t.id === id)
    if (!template) return

    const duplicate: Omit<Template,  'createdAt'> = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
      isDefault: false,
    }

    addTemplate(duplicate)
  }

  // Initialize default template for workspace if none exists
  useEffect(() => {
    if (currentWorkspace) {
      const workspaceTemplates = getWorkspaceTemplates(currentWorkspace.id)
      if (workspaceTemplates.length === 0) {
        addTemplate({
          ...standardTemplate,
          workspaceId: currentWorkspace.id,
        })
      }
    }
  }, [currentWorkspace])

  return (
    <TemplateContext.Provider value={{
      templates,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      getWorkspaceTemplates,
      setDefaultTemplate,
      getDefaultTemplate,
      duplicateTemplate,
    }}>
      {children}
    </TemplateContext.Provider>
  )
}

export const useTemplate = () => useContext(TemplateContext) 