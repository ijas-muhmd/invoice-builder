import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Customer Management | Business Contacts',
  description: 'Manage your customer database, add new clients, and maintain business relationships all in one place.',
  openGraph: {
    title: 'Customer Management | Invoicify',
    description: 'Manage your customer database and business contacts.',
  }
}

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 