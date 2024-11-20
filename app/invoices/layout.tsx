import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manage Invoices | Invoice Dashboard',
  description: 'View, manage, and track all your invoices in one place. Filter by status, search, and organize your billing efficiently.',
  openGraph: {
    title: 'Invoice Dashboard | Invoicify',
    description: 'View and manage all your invoices in one place.',
  }
}

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 