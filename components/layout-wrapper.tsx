"use client"

import { GlobalHeader } from "@/components/global-header"

interface LayoutWrapperProps {
  children: React.ReactNode
  showGlobalHeader?: boolean
}

export function LayoutWrapper({ children, showGlobalHeader = true }: LayoutWrapperProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showGlobalHeader && <GlobalHeader />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 