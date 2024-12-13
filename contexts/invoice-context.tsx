"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { type InvoiceFormValues } from "@/app/invoice-schema"
import { useWorkspace } from "@/contexts/workspace-context"
import { useBusinessDetails } from "@/contexts/business-details-context"
import { v4 as uuidv4 } from 'uuid'

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue'

export interface Invoice extends Omit<InvoiceFormValues, 'date' | 'dueDate'> {
  updatedAt: any
  id: string
  createdAt: string
  status: InvoiceStatus
  date: string | Date
  dueDate: string | Date
  workspaceId: string
  activeFields?: string[]
  selectedBankAccountId?: string
}

interface InvoiceContextType {
  invoices: Invoice[]
  addInvoice: (invoice: InvoiceFormValues, status: InvoiceStatus) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  saveDraft: (formData: InvoiceFormValues) => string
  getDraft: () => (InvoiceFormValues & { id: string }) | null
  clearDraft: () => void
  getInvoice: (id: string) => Invoice | undefined
  getWorkspaceInvoices: (workspaceId: string) => Invoice[]
}

const InvoiceContext = createContext<InvoiceContextType>({
  invoices: [],
  addInvoice: () => {},
  updateInvoice: () => {},
  deleteInvoice: () => {},
  saveDraft: () => "",
  getDraft: () => null,
  clearDraft: () => {},
  getInvoice: () => undefined,
  getWorkspaceInvoices: () => [],
})

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const { currentWorkspace } = useWorkspace()
  const { businessDetails } = useBusinessDetails()
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('invoices')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices))
  }, [invoices])

  const getNextInvoiceNumber = () => {
    if (invoices.length === 0) return "INV-0001";
    
    const numbers = invoices.map(inv => {
      const match = inv.number.match(/INV-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    const maxNumber = Math.max(...numbers);
    return `INV-${String(maxNumber + 1).padStart(4, '0')}`;
  };

  const addInvoice = (data: InvoiceFormValues, status: InvoiceStatus = 'pending', activeFields?: string[]) => {
    const newInvoice: Invoice = {
      ...data,
      id: uuidv4(),
      number: getNextInvoiceNumber(),
      status,
      createdAt: new Date().toISOString(),
      date: data.date ? (typeof data.date === 'string' ? data.date : data.date.toISOString()) : new Date().toISOString(),
      dueDate: data.dueDate ? (typeof data.dueDate === 'string' ? data.dueDate : data.dueDate.toISOString()) : new Date().toISOString(),
      gst: activeFields?.includes('gst') ? (data.gst || "") : undefined,
      taxId: activeFields?.includes('taxId') ? (data.taxId || "") : undefined,
      vatNumber: activeFields?.includes('vatNumber') ? (data.vatNumber || "") : undefined,
      customerId: activeFields?.includes('customerId') ? (data.customerId || "") : undefined,
      referenceNumber: activeFields?.includes('referenceNumber') ? (data.referenceNumber || "") : undefined,
      projectCode: activeFields?.includes('projectCode') ? (data.projectCode || "") : undefined,
      bankDetails: activeFields?.includes('bankDetails') ? (data.bankDetails || "") : undefined,
      termsAndConditions: activeFields?.includes('termsAndConditions') ? (data.termsAndConditions || "") : undefined,
      itemLabels: data.itemLabels || {
        description: "DESCRIPTION",
        quantity: "QTY",
        price: "PRICE",
        amount: "AMOUNT"
      },
      activeFields,
      workspaceId: currentWorkspace?.id || "",
      updatedAt: undefined
    };

    setInvoices(prev => [...prev, newInvoice]);
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>, activeFields?: string[]) => {
    setInvoices(prev => prev.map(invoice => {
      if (invoice.id === id) {
        const hasChanges = JSON.stringify(invoice) !== JSON.stringify({
          ...invoice,
          ...updates,
          date: updates.date ? (typeof updates.date === 'string' ? updates.date : updates.date.toISOString()) : invoice.date,
          dueDate: updates.dueDate ? (typeof updates.dueDate === 'string' ? updates.dueDate : updates.dueDate.toISOString()) : invoice.dueDate,
          activeFields: activeFields || invoice.activeFields,
        });

        if (!hasChanges) return invoice;

        return {
          ...invoice,
          ...updates,
          date: updates.date ? (typeof updates.date === 'string' ? updates.date : updates.date.toISOString()) : invoice.date,
          dueDate: updates.dueDate ? (typeof updates.dueDate === 'string' ? updates.dueDate : updates.dueDate.toISOString()) : invoice.dueDate,
          activeFields: activeFields || invoice.activeFields,
        };
      }
      return invoice;
    }));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  const saveDraft = (data: InvoiceFormValues) => {
    const activeCustomFields = localStorage.getItem('active_custom_fields');
    const activeFields = activeCustomFields ? JSON.parse(activeCustomFields) : [];

    const selectedBankAccountId = localStorage.getItem('selected_bank_account_id');
    const draftId = data.id || uuidv4();

    const draftData = {
      ...data,
      id: draftId,
      gst: activeFields.includes('gst') ? (data.gst || "") : undefined,
      taxId: activeFields.includes('taxId') ? (data.taxId || "") : undefined,
      vatNumber: activeFields.includes('vatNumber') ? (data.vatNumber || "") : undefined,
      customerId: activeFields.includes('customerId') ? (data.customerId || "") : undefined,
      referenceNumber: activeFields.includes('referenceNumber') ? (data.referenceNumber || "") : undefined,
      projectCode: activeFields.includes('projectCode') ? (data.projectCode || "") : undefined,
      bankDetails: activeFields.includes('bankDetails') ? {
        content: data.bankDetails || "",
        selectedBankAccountId: selectedBankAccountId || undefined
      } : undefined,
      termsAndConditions: activeFields.includes('termsAndConditions') ? (data.termsAndConditions || "") : undefined,
      itemLabels: data.itemLabels || {
        description: "DESCRIPTION",
        quantity: "QTY",
        price: "PRICE",
        amount: "AMOUNT"
      },
      activeFields
    };

    localStorage.setItem('invoice_draft', JSON.stringify(draftData));
    return draftId;
  };

  const getDraft = () => {
    const draft = localStorage.getItem('invoice_draft');
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      if (parsedDraft.activeFields) {
        localStorage.setItem('active_custom_fields', JSON.stringify(parsedDraft.activeFields));
      }

      if (parsedDraft.bankDetails?.selectedBankAccountId) {
        localStorage.setItem('selected_bank_account_id', parsedDraft.bankDetails.selectedBankAccountId);
      }

      const draftId = parsedDraft.id || uuidv4();

      return {
        ...parsedDraft,
        id: draftId,
        date: new Date(parsedDraft.date),
        dueDate: new Date(parsedDraft.dueDate),
        gst: parsedDraft.gst || "",
        taxId: parsedDraft.taxId || "",
        vatNumber: parsedDraft.vatNumber || "",
        customerId: parsedDraft.customerId || "",
        referenceNumber: parsedDraft.referenceNumber || "",
        projectCode: parsedDraft.projectCode || "",
        bankDetails: parsedDraft.bankDetails?.content || "",
        termsAndConditions: parsedDraft.termsAndConditions || "",
        itemLabels: parsedDraft.itemLabels || {
          description: "DESCRIPTION",
          quantity: "QTY",
          price: "PRICE",
          amount: "AMOUNT"
        }
      } as InvoiceFormValues & { id: string };
    }
    return null;
  };

  const clearDraft = () => {
    localStorage.removeItem('invoice-draft')
  }

  const getInvoice = (id: string) => {
    return invoices.find(inv => inv.id === id)
  }

  return (
    <InvoiceContext.Provider value={{
      invoices,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      saveDraft,
      getDraft,
      clearDraft,
      getInvoice,
      getWorkspaceInvoices: (workspaceId: string) => 
        invoices.filter(inv => inv.workspaceId === workspaceId),
    }}>
      {children}
    </InvoiceContext.Provider>
  )
}

export const useInvoices = () => useContext(InvoiceContext) 
