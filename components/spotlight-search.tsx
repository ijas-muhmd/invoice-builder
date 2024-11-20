"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useInvoices } from "@/contexts/invoice-context"
import { useCustomers } from "@/contexts/customer-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { SearchIcon, Receipt, User, Calendar } from "lucide-react"
import { format } from "date-fns"

export function SpotlightSearch() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { invoices } = useInvoices()
  const { customers } = useCustomers()
  const { currentWorkspace, workspaces } = useWorkspace()

  // Calculate status counts
  const statusCounts = useMemo(() => {
    return invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [invoices])

  const searchResults = useMemo(() => {
    const results = [
      // Invoice results with workspace info
      ...invoices.map(invoice => ({
        type: 'invoice' as const,
        id: invoice.id,
        title: invoice.number,
        subtitle: `${invoice.to.businessName} - ${format(new Date(invoice.date), 'PP')}`,
        status: invoice.status,
        href: `/invoice/${invoice.id}`,
        workspaceId: invoice.workspaceId,
        workspaceName: workspaces.find(w => w.id === invoice.workspaceId)?.name || 'Unknown',
        keywords: [
          invoice.number,
          invoice.to.businessName,
          invoice.status,
          format(new Date(invoice.date), 'PP'),
        ].join(' ').toLowerCase()
      })),
      // Status-based searches for current workspace only
      {
        type: 'status' as const,
        id: 'draft',
        title: 'Draft Invoices',
        subtitle: `View all draft invoices (${
          invoices.filter(inv => 
            inv.workspaceId === currentWorkspace?.id && 
            inv.status === 'draft'
          ).length
        })`,
        href: '/invoices',
        status: 'draft',
        workspaceId: currentWorkspace?.id,
        keywords: 'draft invoices unpublished'
      },
      {
        type: 'status' as const,
        id: 'pending',
        title: 'Pending Invoices',
        subtitle: `View all pending invoices (${statusCounts.pending || 0})`,
        href: '/invoices',
        status: 'pending',
        keywords: 'pending invoices unpaid waiting'
      },
      {
        type: 'status' as const,
        id: 'paid',
        title: 'Paid Invoices',
        subtitle: `View all paid invoices (${statusCounts.paid || 0})`,
        href: '/invoices',
        status: 'paid',
        keywords: 'paid invoices completed'
      },
      {
        type: 'status' as const,
        id: 'overdue',
        title: 'Overdue Invoices',
        subtitle: `View all overdue invoices (${statusCounts.overdue || 0})`,
        href: '/invoices',
        status: 'overdue',
        keywords: 'overdue invoices late payment'
      },
      // Customer results
      ...customers.map(customer => ({
        type: 'customer' as const,
        id: customer.id,
        title: customer.businessName,
        subtitle: customer.email,
        href: `/customers`,
        keywords: [
          customer.businessName,
          customer.email,
          customer.phone || '',
        ].join(' ').toLowerCase()
      }))
    ]

    return results
  }, [invoices, customers, statusCounts, currentWorkspace, workspaces])

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0">
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search across all workspaces..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Invoices">
                {searchResults
                  .filter(result => result.type === 'invoice')
                  .map(result => (
                    <CommandItem
                      key={result.id}
                      value={result.keywords}
                      onSelect={() => {
                        router.push(result.href)
                        setOpen(false)
                      }}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">{result.title}</span>
                          {'status' in result && (
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              result.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                              result.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                              result.status === 'overdue' ? 'bg-red-500/10 text-red-500' :
                              'bg-gray-500/10 text-gray-500'
                            }`}>
                              {result.status.toUpperCase()}
                            </span>
                          )}
                          {result.workspaceId !== currentWorkspace?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              from {result.workspaceName}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.subtitle}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="Status">
                {searchResults
                  .filter(result => result.type === 'status')
                  .map(result => (
                    <CommandItem
                      key={result.id}
                      value={result.keywords}
                      onSelect={() => {
                        // Navigate to invoices page with status filter
                        router.push(`${result.href}?status=${result.status}`)
                        setOpen(false)
                      }}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.subtitle}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="Customers">
                {searchResults
                  .filter(result => result.type === 'customer')
                  .map(result => (
                    <CommandItem
                      key={result.id}
                      value={result.keywords}
                      onSelect={() => {
                        router.push(result.href)
                        setOpen(false)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.subtitle}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
} 