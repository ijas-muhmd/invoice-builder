"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { BusinessDetailsProvider } from "@/contexts/business-details-context"
import { InvoiceProvider, useInvoices } from "@/contexts/invoice-context"
import { CustomerProvider } from "@/contexts/customer-context"
import { Toaster } from "@/components/ui/toaster"
import { AutosaveIndicator } from "@/components/autosave-indicator"
import Sidebar from '@/components/Sidebar'
import { AdBanner } from "@/components/ad-banner"
import { PinEntryDialog } from "@/components/pin-entry-dialog"
import { HelpCenter } from "@/components/help-center"
import { WelcomeSlider } from "@/components/welcome-slider"
import { WorkspaceProvider, useWorkspace } from "@/contexts/workspace-context"
import { BusinessProvider } from "@/contexts/business-context"
import { PinProtectionProvider } from "@/contexts/pin-protection-context"
import { BankAccountsProvider } from "@/contexts/bank-accounts-context"
import { FinancialProvider, type Transaction } from "@/contexts/financial-context"
import { GlobalHeader } from "@/components/global-header"
import { FloatingActionButton as FloatingAddButton } from "@/components/floating-action-button"
import { useFinancial } from "@/contexts/financial-context"
import { TaskProvider } from "@/contexts/task-context"

// Helper function to calculate invoice total
function calculateInvoiceTotal(invoice: any): number {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
  const taxAmount = subtotal * ((invoice.tax || 0) / 100);
  return subtotal + (invoice.shipping || 0) + taxAmount - (invoice.discount || 0);
}

// Create a wrapper component that handles invoice-financial sync
function InvoiceProviderWithSync({ children }: { children: React.ReactNode }) {
  const { addTransaction, updateTransaction, deleteTransaction, transactions } = useFinancial();
  const { invoices } = useInvoices();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (!currentWorkspace) return;
    
    // Get all existing invoice transactions
    const existingInvoiceTransactions = transactions.filter(t => t.invoiceId);
    
    // Process each invoice
    invoices.forEach(invoice => {
      const transactionId = `inv_${invoice.id}`;
      const existingTransaction = existingInvoiceTransactions.find(t => t.invoiceId === invoice.id);
      const isRelevant = invoice.status === 'paid' || invoice.status === 'pending';
      
      if (isRelevant) {
        const txStatus = invoice.status === 'paid' ? 'paid' : 'pending';
        const items = Array.isArray(invoice.items) ? invoice.items : [];
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const taxAmount = subtotal * ((invoice.tax || 0) / 100);
        const total = subtotal + (invoice.shipping || 0) + taxAmount - (invoice.discount || 0);
        
        const transaction: Transaction = {
          id: transactionId,
          title: `Invoice Payment - ${invoice.number}`,
          amount: total,
          currency: invoice.currency || 'USD',
          category: 'invoice',
          date: typeof invoice.date === 'string' ? invoice.date : invoice.date?.toISOString() || new Date().toISOString(),
          description: `Payment received for invoice ${invoice.number}`,
          customer: invoice.customerId || '',
          status: txStatus,
          type: 'income',
          invoiceId: invoice.id,
          paymentMethodId: invoice.selectedBankAccountId,
          workspaceId: currentWorkspace.id,
          createdAt: invoice.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!existingTransaction) {
          // Only add if no transaction exists for this invoice
          addTransaction(transaction);
        } else if (
          existingTransaction.amount !== transaction.amount ||
          existingTransaction.currency !== transaction.currency ||
          existingTransaction.status !== transaction.status ||
          existingTransaction.title !== transaction.title ||
          existingTransaction.description !== transaction.description
        ) {
          // Update only if relevant fields have changed
          updateTransaction(transaction);
        }
      } else if (existingTransaction) {
        // Delete transaction if invoice is no longer relevant
        deleteTransaction(transactionId);
      }
    });
  }, [invoices, transactions, addTransaction, updateTransaction, deleteTransaction, currentWorkspace]);

  const handleInvoiceStatusChange = (invoice: any, newStatus: string) => {
    const transactionId = `inv_${invoice.id}`;
    
    if (newStatus === 'paid') {
      // Create or update income transaction for paid invoice
      const transaction: Transaction = {
        id: transactionId,
        title: `Invoice Payment - ${invoice.number}`,
        amount: calculateInvoiceTotal(invoice),
        currency: invoice.currency || 'USD',
        category: 'invoice',
        date: new Date().toISOString(),
        description: `Payment received for invoice ${invoice.number}`,
        customer: invoice.customerId || '',
        status: 'paid' as const,
        type: 'income' as const,
        invoiceId: invoice.id,
        paymentMethodId: invoice.selectedBankAccountId,
        workspaceId: invoice.workspaceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      try {
        updateTransaction(transaction);
      } catch {
        addTransaction(transaction);
      }
    } else if (invoice.status === 'paid' && newStatus !== 'paid') {
      // Delete income transaction if invoice is no longer paid
      try {
        deleteTransaction(transactionId);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleInvoiceDelete = (invoiceId: string) => {
    const transactionId = `inv_${invoiceId}`;
    try {
      deleteTransaction(transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  return (
    <InvoiceProvider 
      onInvoiceStatusChange={handleInvoiceStatusChange}
      onInvoiceDelete={handleInvoiceDelete}
    >
      {children}
    </InvoiceProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [tourCompleted, setTourCompleted] = useState(false)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WorkspaceProvider>
        <BusinessProvider>
          <FinancialProvider>
            <BankAccountsProvider>
              <BusinessDetailsProvider>
                <InvoiceProviderWithSync>
                  <CustomerProvider>
                    <TaskProvider>
                      <div className="min-h-screen flex flex-col">
                        <GlobalHeader />
                        <div className="flex flex-1 pt-14">
                          <Sidebar />
                          <main className="flex-1 ml-72">
                            {children}
                          </main>
                        </div>
                      </div>
                      <FloatingAddButton />
                      <AutosaveIndicator saving={false} />
                      <AdBanner tourCompleted={tourCompleted} />
                      <PinEntryDialog open={false} onOpenChange={function (open: boolean): void {
                        throw new Error("Function not implemented.")
                      } } onSubmit={function (pin: string): void {
                        throw new Error("Function not implemented.")
                      } }  />
                      <Toaster />
                    </TaskProvider>
                  </CustomerProvider>
                </InvoiceProviderWithSync>
              </BusinessDetailsProvider>
            </BankAccountsProvider>
          </FinancialProvider>
        </BusinessProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  )
} 