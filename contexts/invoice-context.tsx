"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { type InvoiceFormValues } from "@/app/invoice-schema"
import { useWorkspace } from "@/contexts/workspace-context"
import { useBusinessDetails } from "@/contexts/business-details-context"
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { type Transaction } from "@/contexts/financial-context"

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
  addInvoice: (formData: InvoiceFormValues, status?: InvoiceStatus) => void
  updateInvoice: (id: string, formData: InvoiceFormValues) => void
  deleteInvoice: (id: string) => void
  saveDraft: (formData: InvoiceFormValues) => Promise<string>
  getDraft: () => Promise<(InvoiceFormValues & { id: string }) | null>
  clearDraft: () => Promise<void>
  getInvoice: (id: string) => Invoice | undefined
  getWorkspaceInvoices: (workspaceId: string) => Invoice[]
  duplicateInvoice: (id: string) => Promise<void>
}

interface InvoiceProviderProps {
  children: React.ReactNode
  onInvoiceStatusChange?: (invoice: Invoice, newStatus: InvoiceStatus) => void
  onInvoiceDelete?: (invoiceId: string) => void
}

const InvoiceContext = createContext<InvoiceContextType>({
  invoices: [],
  addInvoice: () => {},
  updateInvoice: () => {},
  deleteInvoice: () => {},
  saveDraft: async () => "",
  getDraft: async () => null,
  clearDraft: async () => {},
  getInvoice: () => undefined,
  getWorkspaceInvoices: () => [],
  duplicateInvoice: async () => {},
})

export function InvoiceProvider({ children, onInvoiceStatusChange, onInvoiceDelete }: InvoiceProviderProps) {
  const { currentWorkspace } = useWorkspace()
  const { businessDetails } = useBusinessDetails()
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Load invoices from IndexedDB on mount
  useEffect(() => {
    const loadInvoices = async () => {
      const saved = await db.getAll('invoices');
      if (saved) {
        setInvoices(saved);
      }
    };
    loadInvoices();
  }, []);

  // Save invoices to IndexedDB when they change
  useEffect(() => {
    const saveInvoices = async () => {
      if (invoices.length > 0) {
        // Save each invoice individually
        await Promise.all(invoices.map(invoice => 
          db.set('invoices', invoice.id, invoice)
        ));
      }
    };
    saveInvoices();
  }, [invoices]);

  const getNextInvoiceNumber = async () => {
    try {
      const allInvoices = await db.getAll('invoices');
      if (!allInvoices || allInvoices.length === 0) return "INV-0001";
    
      const numbers = allInvoices.map(inv => {
      const match = inv.number.match(/INV-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    const maxNumber = Math.max(...numbers);
    return `INV-${String(maxNumber + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error getting next invoice number:', error);
      return `INV-${String(Date.now()).slice(-6)}`; // Fallback
    }
  };

  const addInvoice = async (data: InvoiceFormValues, status: InvoiceStatus = 'pending') => {
    try {
      const activeCustomFields = await db.get('settings', 'active_custom_fields') || [];
    const newInvoice: Invoice = {
      ...data,
      id: uuidv4(),
        number: await getNextInvoiceNumber(),
      status,
      createdAt: new Date().toISOString(),
      date: data.date ? (typeof data.date === 'string' ? data.date : data.date.toISOString()) : new Date().toISOString(),
      dueDate: data.dueDate ? (typeof data.dueDate === 'string' ? data.dueDate : data.dueDate.toISOString()) : new Date().toISOString(),
        gst: activeCustomFields.includes('gst') ? (data.gst || "") : undefined,
        taxId: activeCustomFields.includes('taxId') ? (data.taxId || "") : undefined,
        vatNumber: activeCustomFields.includes('vatNumber') ? (data.vatNumber || "") : undefined,
        customerId: activeCustomFields.includes('customerId') ? (data.customerId || "") : undefined,
        referenceNumber: activeCustomFields.includes('referenceNumber') ? (data.referenceNumber || "") : undefined,
        projectCode: activeCustomFields.includes('projectCode') ? (data.projectCode || "") : undefined,
        bankDetails: activeCustomFields.includes('bankDetails') ? (data.bankDetails || "") : undefined,
        termsAndConditions: activeCustomFields.includes('termsAndConditions') ? (data.termsAndConditions || "") : undefined,
      itemLabels: data.itemLabels || {
        description: "DESCRIPTION",
        quantity: "QTY",
        price: "PRICE",
        amount: "AMOUNT"
      },
        activeFields: activeCustomFields,
      workspaceId: currentWorkspace?.id || "",
        updatedAt: new Date().toISOString()
    };

      // Save to IndexedDB first
      await db.set('invoices', newInvoice.id, newInvoice);
      
      // Then update state
    setInvoices(prev => [...prev, newInvoice]);
    return newInvoice;
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
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

        const updatedInvoice = {
          ...invoice,
          ...updates,
          date: updates.date ? (typeof updates.date === 'string' ? updates.date : updates.date.toISOString()) : invoice.date,
          dueDate: updates.dueDate ? (typeof updates.dueDate === 'string' ? updates.dueDate : updates.dueDate.toISOString()) : invoice.dueDate,
          activeFields: activeFields || invoice.activeFields,
        };

        // Notify parent about status change
        if (updates.status && onInvoiceStatusChange) {
          onInvoiceStatusChange(updatedInvoice, updates.status);
        }

        return updatedInvoice;
      }
      return invoice;
    }));
  };

  const deleteInvoice = (id: string) => {
    // Notify parent about deletion
    if (onInvoiceDelete) {
      onInvoiceDelete(id);
    }
    
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }

  // Helper function to calculate invoice total
  const calculateInvoiceTotal = (invoice: Invoice): number => {
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * ((invoice.tax || 0) / 100);
    return subtotal + (invoice.shipping || 0) + taxAmount - (invoice.discount || 0);
  };

  const saveDraft = async (data: InvoiceFormValues) => {
    const activeCustomFields = await db.get('settings', 'active_custom_fields');
    const activeFields = activeCustomFields || [];

    const selectedBankAccountId = await db.get('settings', 'selected_bank_account_id');
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

    await db.set('drafts', draftId, draftData);
    return draftId;
  };

  const getDraft = async () => {
    const draft = await db.get('drafts', 'current');
    if (draft) {
      if (draft.activeFields) {
        await db.set('settings', 'active_custom_fields', draft.activeFields);
      }

      if (draft.bankDetails?.selectedBankAccountId) {
        await db.set('settings', 'selected_bank_account_id', draft.bankDetails.selectedBankAccountId);
      }

      const draftId = draft.id || uuidv4();

      return {
        ...draft,
        id: draftId,
        date: new Date(draft.date),
        dueDate: new Date(draft.dueDate),
        gst: draft.gst || "",
        taxId: draft.taxId || "",
        vatNumber: draft.vatNumber || "",
        customerId: draft.customerId || "",
        referenceNumber: draft.referenceNumber || "",
        projectCode: draft.projectCode || "",
        bankDetails: draft.bankDetails?.content || "",
        termsAndConditions: draft.termsAndConditions || "",
        itemLabels: draft.itemLabels || {
          description: "DESCRIPTION",
          quantity: "QTY",
          price: "PRICE",
          amount: "AMOUNT"
        }
      } as InvoiceFormValues & { id: string };
    }
    return null;
  };

  const clearDraft = async () => {
    await db.delete('drafts', 'current');
  }

  const getInvoice = (id: string) => {
    return invoices.find(inv => inv.id === id)
  }

  const duplicateInvoice = async (id: string) => {
    try {
      const invoiceToDuplicate = invoices.find(inv => inv.id === id);
      if (!invoiceToDuplicate) {
        throw new Error('Invoice not found');
      }

      const nextNumber = await getNextInvoiceNumber();
      
      // Create a new invoice object with the duplicated data
      const duplicatedInvoice: Invoice = {
        ...invoiceToDuplicate,
        id: uuidv4(),
        number: nextNumber,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to IndexedDB first
      await db.set('invoices', duplicatedInvoice.id, duplicatedInvoice);
      
      // Then update state
      setInvoices(prev => [...prev, duplicatedInvoice]);
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      throw error;
    }
  };

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
      duplicateInvoice,
    }}>
      {children}
    </InvoiceContext.Provider>
  )
}

export const useInvoices = () => useContext(InvoiceContext) 
