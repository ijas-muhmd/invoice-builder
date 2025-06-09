import { Invoice } from '@/contexts/invoice-context'
import { Customer } from '@/contexts/customer-context'

export interface CustomerFinancialSummary {
  customerId: string
  customerName: string
  totalInvoices: number
  totalIncome: number
  totalPaid: number
  totalOutstanding: number
  totalOverdue: number
  averageInvoiceAmount: number
  lastInvoiceDate: Date | null
  invoicesByStatus: {
    draft: number
    pending: number
    paid: number
    overdue: number
  }
  currency: string
}

export function calculateInvoiceTotal(invoice: Invoice): number {
  const items = Array.isArray(invoice.items) ? invoice.items : []
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const taxAmount = subtotal * (invoice.tax / 100)
  return subtotal + taxAmount + invoice.shipping - invoice.discount
}

export function calculateInvoiceBalance(invoice: Invoice): number {
  const total = calculateInvoiceTotal(invoice)
  return total - (invoice.amountPaid || 0)
}

export function getCustomerInvoices(customerId: string, allInvoices: Invoice[]): Invoice[] {
  return allInvoices.filter(invoice => 
    invoice.customerId === customerId || 
    invoice.to?.businessName === getCustomerNameFromInvoices(customerId, allInvoices)
  )
}

export function getCustomerNameFromInvoices(customerId: string, allInvoices: Invoice[]): string {
  const invoice = allInvoices.find(inv => inv.customerId === customerId)
  return invoice?.to?.businessName || 'Unknown Customer'
}

export function calculateCustomerFinancialSummary(
  customer: Customer, 
  allInvoices: Invoice[]
): CustomerFinancialSummary {
  // Get invoices for this customer (by customerId or business name match)
  const customerInvoices = allInvoices.filter(invoice => 
    invoice.customerId === customer.id || 
    invoice.to?.businessName === customer.businessName
  )

  const totalInvoices = customerInvoices.length
  const totalIncome = customerInvoices.reduce((sum, invoice) => sum + calculateInvoiceTotal(invoice), 0)
  const totalPaid = customerInvoices.reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0)
  const totalOutstanding = customerInvoices
    .filter(invoice => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + calculateInvoiceBalance(invoice), 0)
  
  const totalOverdue = customerInvoices
    .filter(invoice => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + calculateInvoiceBalance(invoice), 0)

  const averageInvoiceAmount = totalInvoices > 0 ? totalIncome / totalInvoices : 0

  const lastInvoiceDate = customerInvoices.length > 0 
    ? new Date(Math.max(...customerInvoices.map(inv => new Date(inv.date).getTime())))
    : null

  const invoicesByStatus = {
    draft: customerInvoices.filter(inv => inv.status === 'draft').length,
    pending: customerInvoices.filter(inv => inv.status === 'pending').length,
    paid: customerInvoices.filter(inv => inv.status === 'paid').length,
    overdue: customerInvoices.filter(inv => inv.status === 'overdue').length,
  }

  // Get currency from the most recent invoice, defaulting to EUR
  const currency = customerInvoices[0]?.currency || 'EUR'

  return {
    customerId: customer.id,
    customerName: customer.businessName,
    totalInvoices,
    totalIncome,
    totalPaid,
    totalOutstanding,
    totalOverdue,
    averageInvoiceAmount,
    lastInvoiceDate,
    invoicesByStatus,
    currency
  }
}

export function getCurrencySymbol(currency: string = 'EUR'): string {
  switch (currency) {
    case 'USD':
      return '$'
    case 'GBP':
      return '£'
    case 'EUR':
    default:
      return '€'
  }
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${amount.toFixed(2)}`
}

export function getAllCustomersFinancialSummary(
  customers: Customer[], 
  allInvoices: Invoice[]
): CustomerFinancialSummary[] {
  return customers.map(customer => calculateCustomerFinancialSummary(customer, allInvoices))
}

export function getTopCustomersByIncome(
  customers: Customer[], 
  allInvoices: Invoice[], 
  limit: number = 10
): CustomerFinancialSummary[] {
  const summaries = getAllCustomersFinancialSummary(customers, allInvoices)
  return summaries
    .sort((a, b) => b.totalIncome - a.totalIncome)
    .slice(0, limit)
}

export function getCustomersWithOutstandingBalance(
  customers: Customer[], 
  allInvoices: Invoice[]
): CustomerFinancialSummary[] {
  const summaries = getAllCustomersFinancialSummary(customers, allInvoices)
  return summaries.filter(summary => summary.totalOutstanding > 0)
} 