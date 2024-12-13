'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sun, Moon, LayoutDashboard, PlusCircle, Users, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Link from 'next/link';
import { format } from "date-fns";
import { ProfileMenu } from "@/components/profile-menu"
import { useInvoices } from "@/contexts/invoice-context";
import { useBusinessDetails } from "@/contexts/business-details-context";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { InvoiceFormValues } from "@/app/invoice-schema";
import { cn } from "@/lib/utils";
import { InvoiceStats } from "@/components/invoice-stats"
import { SpotlightSearch } from "@/components/spotlight-search"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { useWorkspace } from "@/contexts/workspace-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function Sidebar() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme();
  const { invoices, addInvoice, saveDraft, deleteInvoice, getDraft, clearDraft } = useInvoices();
  const { businessDetails } = useBusinessDetails();
  const router = useRouter();
  const pathname = usePathname();
  const currentInvoiceId = pathname.startsWith('/invoice/') ? pathname.split('/')[2] : null;
  const { currentWorkspace } = useWorkspace();
  const [newDraftId, setNewDraftId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter recent invoices by workspace
  const recentInvoices = useMemo(() => {
    return currentWorkspace
      ? invoices
          .filter(inv => inv.workspaceId === currentWorkspace.id)
          .sort((a, b) => {
            // Sort by updatedAt if it exists, otherwise use createdAt
            const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
            const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
            return bDate.getTime() - aDate.getTime(); // Most recent first
          })
          .slice(0, 3)
      : []
  }, [invoices, currentWorkspace])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'overdue':
        return 'bg-red-500/10 text-red-500';
      case 'draft':
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const handleNewInvoice = () => {
    const currentDraft = getDraft();
    if (currentDraft) {
      // Save current as draft
      addInvoice(currentDraft, 'draft');
      const newDraftId = currentDraft.id;
      setNewDraftId(newDraftId);
      setTimeout(() => setNewDraftId(null), 2000);
      
      // Create new invoice
      const newInvoice: InvoiceFormValues = {
        logo: "",
        number: `INV-${String(Date.now()).slice(-6)}`,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentTerms: "",
        poNumber: "",
        currency: "EUR",
        from: {
          name: businessDetails.name || "",
          email: businessDetails.email || "",
          address: businessDetails.address || "",
          phone: businessDetails.phone || "",
          taxNumber: businessDetails.taxNumber || "",
          postalCode: businessDetails.postalCode || "",
        },
        to: {
          businessName: "",
          address: "",
          optional: "",
        },
        items: [{ description: "", quantity: 0, rate: 0 }],
        tax: 0,
        shipping: 0,
        discount: 0,
        amountPaid: 0,
        notes: "",
        terms: "",
        gst: "",
        taxId: "",
        vatNumber: "",
        customerId: "",
        referenceNumber: "",
        projectCode: "",
        itemLabels: {
          description: "DESCRIPTION",
          quantity: "QTY",
          price: "PRICE",
          amount: "AMOUNT"
        },
      };
      saveDraft(newInvoice);
    }
    router.push('/');
  };

  const calculateInvoiceTotal = (invoice: any) => {
    const subtotal = invoice.items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.rate), 0
    );
    const taxAmount = subtotal * (invoice.tax / 100);
    return subtotal + taxAmount + invoice.shipping - invoice.discount;
  };

  return (
    <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6">
        <div className="flex h-16 shrink-0 items-center" data-tour="logo">
          <Link href="/" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">Invoice Maker</span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                FREE
              </span>
            </div>
          </Link>
        </div>

        <div className="px-2">
          <WorkspaceSwitcher />
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-2">
            <li>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    data-tour="new-invoice"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Invoice
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>You have an invoice in progress</AlertDialogTitle>
                    <AlertDialogDescription>
                      Would you like to continue with your current invoice or start a new one? If you start a new invoice, your current progress will be saved as a draft.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        // Just close the dialog and stay on current invoice
                      }}
                    >
                      Continue Current Invoice
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        const currentDraft = getDraft();
                        if (currentDraft) {
                          // Save current as draft
                          addInvoice(currentDraft, 'draft');
                          clearDraft();
                          
                          // Create new draft
                          const newDraft: InvoiceFormValues = {
                            logo: "",
                            number: `INV-${String(Date.now()).slice(-6)}`,
                            date: new Date(),
                            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            paymentTerms: "",
                            poNumber: "",
                            currency: "EUR",
                            from: {
                              name: businessDetails.name || "",
                              email: businessDetails.email || "",
                              address: businessDetails.address || "",
                              phone: businessDetails.phone || "",
                              taxNumber: businessDetails.taxNumber || "",
                              postalCode: businessDetails.postalCode || "",
                            },
                            to: {
                              businessName: "",
                              address: "",
                              optional: "",
                            },
                            items: [{ description: "", quantity: 0, rate: 0 }],
                            tax: 0,
                            shipping: 0,
                            discount: 0,
                            amountPaid: 0,
                            notes: "",
                            terms: "",
                            gst: "",
                            taxId: "",
                            vatNumber: "",
                            customerId: "",
                            referenceNumber: "",
                            projectCode: "",
                            itemLabels: {
                              description: "DESCRIPTION",
                              quantity: "QTY",
                              price: "PRICE",
                              amount: "AMOUNT"
                            },
                          };
                          saveDraft(newDraft);
                          router.push('/');
                          router.refresh();
                        }
                      }}
                    >
                      Start New Invoice
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>

            <li>
              <Link href="/invoices">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  data-tour="invoice-board"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Invoice Board
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/customers">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  data-tour="customers"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Customers
                </Button>
              </Link>
            </li>

            <li data-tour="recent-invoices">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-muted-foreground">Recent</div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="h-8 w-8"
                  data-tour="theme-toggle"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>
              {mounted && (
                <>
                  {recentInvoices.length > 0 ? (
                    <ul role="list" className="mt-2 space-y-2">
                      {recentInvoices.map((invoice) => (
                        <li key={invoice.id} className="relative">
                          <Link href={`/invoice/${invoice.id}`}>
                            <Card 
                              className={cn(
                                "p-3 hover:bg-muted/50 transition-all duration-300",
                                newDraftId === invoice.id && "bg-primary/10 animate-pulse",
                                currentInvoiceId === invoice.id && "border-primary border-2",
                                "transform transition-transform hover:scale-[1.02]"
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <span className={cn(
                                  "font-medium",
                                  currentInvoiceId === invoice.id && "text-primary"
                                )}>
                                  {invoice.number}
                                </span>
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    getStatusColor(invoice.status),
                                    "transition-colors duration-300"
                                  )}
                                >
                                  {invoice.status.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {format(new Date(invoice.createdAt), 'PP')}
                              </div>
                              <div className="text-sm font-medium mt-1">
                                €{calculateInvoiceTotal(invoice).toFixed(2)}
                              </div>
                            </Card>
                          </Link>
                          {invoice.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity",
                                "hover:bg-destructive/10 hover:text-destructive"
                              )}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (confirm('Are you sure you want to delete this draft?')) {
                                  deleteInvoice(invoice.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-2 rounded-lg border border-dashed p-4">
                      <div className="text-center">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
                        <h3 className="mt-2 text-sm font-medium">No recent invoices</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Create your first invoice to see it here
                        </p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={handleNewInvoice}
                        >
                          Create an invoice
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>

            <li className="mt-auto flex justify-center">
              <InvoiceStats />
            </li>

            <li className="-mx-6 px-6">
              <SpotlightSearch />
            </li>

            <li className="-mx-6" data-tour="profile">
              <ProfileMenu />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
} 
