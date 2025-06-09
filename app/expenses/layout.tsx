import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Financial Tracker | Business Suite",
  description: "Complete financial management with income and expense tracking, analytics, and cash flow analysis.",
}

export default function ExpensesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 