'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sun, Moon, LayoutDashboard, Users, Trash2, FileText, Receipt, TrendingUp, PlusCircle, Calendar, Filter, BarChart3, CheckSquare, ListTodo, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Link from 'next/link';
import { format } from "date-fns";
import { ProfileMenu } from "@/components/profile-menu"
import { useInvoices } from "@/contexts/invoice-context";
import { useFinancial } from "@/contexts/financial-context";
import { useBusinessDetails } from "@/contexts/business-details-context";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { InvoiceFormValues } from "@/app/invoice-schema";
import { cn } from "@/lib/utils";
import { InvoiceStats } from "@/components/invoice-stats"
import { SpotlightSearch } from "@/components/spotlight-search"
import { useWorkspace } from "@/contexts/workspace-context";
import { FinancialTrendChart } from "@/components/financial-trend-chart";
import { useTasks } from "@/contexts/task-context";

export default function Sidebar() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme();
  const { invoices, addInvoice, saveDraft, deleteInvoice, getDraft, clearDraft } = useInvoices();
  const { expenses, categories, totalExpenses, monthlyExpenses } = useFinancial();
  const { businessDetails } = useBusinessDetails();
  const router = useRouter();
  const pathname = usePathname();
  const currentInvoiceId = pathname.startsWith('/invoice/') ? pathname.split('/')[2] : null;
  const { currentWorkspace } = useWorkspace();
  const [newDraftId, setNewDraftId] = useState<string | null>(null);
  const { tasks } = useTasks();

  // Calculate pending tasks count
  const pendingTasksCount = tasks.filter(task => task.status === 'pending').length;

  // Determine current product based on route
  const isFinancialTracker = pathname.startsWith('/expenses');
  const isTaskManager = pathname.startsWith('/tasks');
  const isInvoiceBuilder = !isFinancialTracker && !isTaskManager;

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

  // Filter recent expenses - last 5 expenses
  const recentExpenses = useMemo(() => {
    return expenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [expenses])

  // const recentInvoicesList = useMemo(() => {
  //   return currentWorkspace
  //     ? invoices
  //         .filter(inv => inv.workspaceId === currentWorkspace.id)
          
          
  //     : []
  // }, [invoices, currentWorkspace])

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
      case 'approved':
        return 'bg-blue-500/10 text-blue-500';
      case 'rejected':
        return 'bg-red-500/10 text-red-500';
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#6b7280';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  const calculateInvoiceTotal = (invoice: any) => {
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.rate), 0
    );
    const taxAmount = subtotal * (invoice.tax / 100);
    return subtotal + taxAmount + invoice.shipping - invoice.discount;
  };

  const getNextInvoiceNumber = () => {
    console.log(`invoice length.......${invoices.length}`);
    if (invoices.length === 0) return "INV-0002";
    
    const numbers = invoices.map(inv => {
      const match = inv.number.match(/INV-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    const maxNumber = Math.max(...numbers);
    return `INV-${String(maxNumber + 2).padStart(4, '0')}`;
    // return "INV-0004";
  };

  return (
    <div className="fixed top-14 bottom-0 z-40 flex w-72 flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pt-6">
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-2">
            {isInvoiceBuilder && (
              <>
                <li>
                  <Link href="/invoices">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start",
                        pathname === "/invoices" && "bg-accent text-accent-foreground"
                      )}
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
                      className={cn(
                        "w-full justify-start",
                        pathname === "/customers" && "bg-accent text-accent-foreground"
                      )}
                      data-tour="customers"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Customers
                    </Button>
                  </Link>
                </li>
              </>
            )}

            {isFinancialTracker && (
              <>
                <li>
                  <Link href="/expenses/overview">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start",
                        pathname === "/expenses/overview" && "bg-accent text-accent-foreground"
                      )}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Overview
                    </Button>
                  </Link>
                </li>
                <li>
                  <Link href="/expenses/income">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start",
                        pathname === "/expenses/income" && "bg-accent text-accent-foreground"
                      )}
                    >
                      <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                      Income
                    </Button>
                  </Link>
                </li>
                <li>
                  <Link href="/expenses/list">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start",
                        pathname === "/expenses/list" && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Expenses
                    </Button>
                  </Link>
                </li>
              </>
            )}

            {isTaskManager && (
              <>
                <li>
                  <Link href="/tasks">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start",
                        pathname === "/tasks" && "bg-accent text-accent-foreground"
                      )}
                    >
                      <ListTodo className="mr-2 h-4 w-4" />
                      All Tasks
                    </Button>
                  </Link>
                </li>
                <li>
                  <Link href="/tasks/pending">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start",
                        pathname === "/tasks/pending" && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Pending
                      {pendingTasksCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {pendingTasksCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </li>
                <li>
                  <Link href="/tasks/completed">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start",
                        pathname === "/tasks/completed" && "bg-accent text-accent-foreground"
                      )}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed
                    </Button>
                  </Link>
                </li>
              </>
            )}

            <li data-tour={isInvoiceBuilder ? "recent-invoices" : "recent-expenses"}>
              <div className="flex items-center justify-between bg-background py-2">
                <div className="text-sm font-semibold text-muted-foreground">
                  {isInvoiceBuilder ? "Recent Invoices" : "Recent Expenses"}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="h-8 w-8"
                  data-tour="theme-toggle"
                >
                  <div className="relative h-4 w-4">
                    <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
                  </div>
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>
              {mounted && isInvoiceBuilder && (
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
                      </div>
                    </div>
                  )}
                </>
              )}

              {mounted && isFinancialTracker && (
                <>
                  {recentExpenses.length > 0 ? (
                    <ul role="list" className="mt-2 space-y-2">
                      {recentExpenses.map((expense) => (
                        <li key={expense.id} className="relative">
                          <Card 
                            className={cn(
                              "p-3 hover:bg-muted/50 transition-all duration-300",
                              "transform transition-transform hover:scale-[1.02]"
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: getCategoryColor(expense.category) }}
                                />
                                <span className="font-medium text-sm truncate">
                                  {expense.title}
                                </span>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  getStatusColor(expense.status),
                                  "transition-colors duration-300 text-xs"
                                )}
                              >
                                {expense.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {getCategoryName(expense.category)} • {format(new Date(expense.date), 'MMM dd')}
                            </div>
                            <div className="text-sm font-medium mt-1">
                              {expense.currency} {expense.amount.toFixed(2)}
                            </div>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-2 rounded-lg border border-dashed p-4">
                      <div className="text-center">
                        <Receipt className="mx-auto h-8 w-8 text-muted-foreground/60" />
                        <h3 className="mt-2 text-sm font-medium">No recent expenses</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Add your first expense to see it here
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>

            <li className="mt-auto flex justify-center">
              {isInvoiceBuilder ? (
                <InvoiceStats />
              ) : (
                <FinancialTrendChart />
              )}
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
