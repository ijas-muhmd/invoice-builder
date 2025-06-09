'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import { InvoiceList } from "@/components/invoice-list";
import { ViewSwitcher } from "@/components/view-switcher";
import { useInvoices } from "@/contexts/invoice-context";
import { Button } from "@/components/ui/button";
import { useFinancial } from "@/contexts/financial-context";

export default function InvoicesPage() {
  const [view, setView] = useState<'board' | 'list'>('board');
  const { invoices, deleteInvoice } = useInvoices();
  const { addTransaction, transactions } = useFinancial();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  // Set initial filters based on URL params
  useEffect(() => {
    if (statusFilter) {
      setView('list'); // Switch to list view when filtering
    }
  }, [statusFilter]);

  const handleDelete = (ids: string[]) => {
    ids.forEach(id => deleteInvoice(id));
  };

  // Manual sync handler
  const handleSyncInvoices = () => {
    invoices.forEach(invoice => {
      // Only sync paid or pending invoices
      if (invoice.status === 'paid' || invoice.status === 'pending') {
        const transactionId = `inv_${invoice.id}`;
        const exists = transactions.find(t => t.id === transactionId);
        const items = Array.isArray(invoice.items) ? invoice.items : [];
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const taxAmount = subtotal * ((invoice.tax || 0) / 100);
        const total = subtotal + (invoice.shipping || 0) + taxAmount - (invoice.discount || 0);
        const txStatus = invoice.status === 'paid' ? 'paid' : 'pending';
        if (!exists) {
          addTransaction({
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
          });
        }
      }
    });
  };

  return (
    <div className="container mx-auto p-8 max-w-[1400px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {statusFilter 
            ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Invoices`
            : 'Invoices'
          }
        </h1>
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={handleSyncInvoices}>
            Sync Invoices
          </Button>
          <ViewSwitcher view={view} onViewChange={setView} />
        </div>
      </div>

      {view === 'board' ? (
        <KanbanBoard />
      ) : (
        <InvoiceList 
          invoices={invoices} 
          onDelete={handleDelete}
          // initialStatus={statusFilter || undefined}
        />
      )}
    </div>
  );
} 