'use client';

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { useInvoices, type InvoiceStatus } from "@/contexts/invoice-context"
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/contexts/workspace-context"

interface Column {
  id: 'draft' | 'pending' | 'paid' | 'overdue'
  title: string
}

const columns: Column[] = [
  { id: 'draft', title: 'DRAFT' },
  { id: 'pending', title: 'PENDING' },
  { id: 'paid', title: 'PAID' },
  { id: 'overdue', title: 'OVERDUE' }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-500/10 text-gray-500'
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-500'
    case 'paid':
      return 'bg-green-500/10 text-green-500'
    case 'overdue':
      return 'bg-red-500/10 text-red-500'
  }
}

export default function KanbanBoard() {
  const { invoices, updateInvoice, deleteInvoice } = useInvoices()
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)

  // Filter invoices by current workspace
  const workspaceInvoices = useMemo(() => {
    return currentWorkspace 
      ? invoices.filter(inv => inv.workspaceId === currentWorkspace.id)
      : []
  }, [invoices, currentWorkspace])

  useEffect(() => {
    setMounted(true)
  }, [])

  const calculateInvoiceTotal = (invoice: any) => {
    const subtotal = invoice.items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.rate), 0
    )
    const taxAmount = subtotal * (invoice.tax / 100)
    return subtotal + taxAmount + invoice.shipping - invoice.discount
  }

  const calculateColumnTotal = (status: string) => {
    return workspaceInvoices
      .filter(inv => inv.status === status)
      .reduce((sum, invoice) => sum + calculateInvoiceTotal(invoice), 0)
  }

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newInvoices = [...workspaceInvoices];
    const invoice = newInvoices.find(inv => inv.id === draggableId);
    
    if (invoice) {
      invoice.status = destination.droppableId as InvoiceStatus;
      updateInvoice(draggableId, { status: destination.droppableId as InvoiceStatus });
    }
  };

  if (!mounted) {
    return null
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div>
        <div className="grid grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {columns.map(column => {
            const columnInvoices = workspaceInvoices.filter(inv => inv.status === column.id)
            
            return (
              <div key={column.id} className="flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{column.title}</h3>
                    <Badge variant="secondary">
                      {columnInvoices.length}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: ${calculateColumnTotal(column.id).toFixed(2)}
                  </div>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-xl p-4 ${
                        snapshot.isDraggingOver ? 'bg-accent' : 'bg-muted/50'
                      }`}
                    >
                      <ScrollArea className="h-full">
                        <div className="space-y-3">
                          {columnInvoices.map((invoice, index) => (
                            <Draggable
                              key={invoice.id}
                              draggableId={invoice.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "p-4 card-elevated",
                                    snapshot.isDragging && "shadow-lg",
                                    "hover:shadow-md transition-all duration-200"
                                  )}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1" onClick={() => router.push(`/invoice/${invoice.id}`)}>
                                      <div className="font-medium">{invoice.number}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {invoice.to.businessName}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge
                                        variant="secondary"
                                        className={getStatusColor(invoice.status)}
                                      >
                                        {invoice.status.toUpperCase()}
                                      </Badge>
                                      {invoice.status === 'draft' && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem 
                                              className="text-destructive"
                                              onClick={() => setInvoiceToDelete(invoice.id)}
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete Draft
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-3 flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                                    </span>
                                    <span className="font-medium">
                                      ${calculateInvoiceTotal(invoice).toFixed(2)}
                                    </span>
                                  </div>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </div>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (invoiceToDelete) {
                  deleteInvoice(invoiceToDelete);
                  setInvoiceToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DragDropContext>
  )
} 