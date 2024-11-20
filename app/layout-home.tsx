import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create New Invoice | Free Invoice Builder',
  description: 'Create a professional invoice in minutes with our free invoice builder. Add your business details, customize the template, and download as PDF.',
  openGraph: {
    title: 'Create New Invoice | Invoicify',
    description: 'Create a professional invoice in minutes with our free invoice builder.',
  }
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 