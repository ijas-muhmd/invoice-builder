'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import { InvoiceList } from "@/components/invoice-list";
import { ViewSwitcher } from "@/components/view-switcher";
import { useInvoices } from "@/contexts/invoice-context";

export default function InvoicesPage() {
  const [view, setView] = useState<'board' | 'list'>('board');
  const { invoices, deleteInvoice } = useInvoices();
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

  return (
    <div className="container mx-auto p-8 max-w-[1400px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {statusFilter 
            ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Invoices`
            : 'Invoices'
          }
        </h1>
        <ViewSwitcher view={view} onViewChange={setView} />
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