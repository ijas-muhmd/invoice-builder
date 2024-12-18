"use client"

import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { BusinessDetailsProvider } from "@/contexts/business-details-context"
import { InvoiceProvider } from "@/contexts/invoice-context"
import { CustomerProvider } from "@/contexts/customer-context"
import { Toaster } from "@/components/ui/toaster"
import { AutosaveIndicator } from "@/components/autosave-indicator"
import Sidebar from '@/components/Sidebar'
import { AdBanner } from "@/components/ad-banner"
import { PinEntryDialog } from "@/components/pin-entry-dialog"
import { HelpCenter } from "@/components/help-center"
import { WelcomeSlider } from "@/components/welcome-slider"
import { WorkspaceProvider } from "@/contexts/workspace-context"
import { BusinessProvider } from "@/contexts/business-context"
import { PinProtectionProvider } from "@/contexts/pin-protection-context"
import { BankAccountsProvider } from "@/contexts/bank-accounts-context"

export function Providers({ children }: { children: React.ReactNode }) {
  const [tourCompleted, setTourCompleted] = useState(false)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WorkspaceProvider>
        <BusinessProvider>
          <BankAccountsProvider>
            <BusinessDetailsProvider>
              <InvoiceProvider>
                <CustomerProvider>
                  {/* <PinProtectionProvider> */}
                    <div className="flex">
                      <div className="fixed w-72 h-screen">
                        <Sidebar />
                      </div>
                      <main className="flex-1 ml-72">
                        {children}
                      </main>
                    </div>
                    <AutosaveIndicator saving={false} />
                    {/* <HelpCenter /> */}
                    {/* <WelcomeSlider onComplete={() => setTourCompleted(true)} /> */}
                    <AdBanner tourCompleted={tourCompleted} />
                    {/* <PinEntryDialog /> */}
                    <PinEntryDialog open={false} onOpenChange={function (open: boolean): void {
                      throw new Error("Function not implemented.")
                    } } onSubmit={function (pin: string): void {
                      throw new Error("Function not implemented.")
                    } }  />
                    <Toaster />
                  {/* </PinProtectionProvider> */}
                </CustomerProvider>
              </InvoiceProvider>
            </BusinessDetailsProvider>
          </BankAccountsProvider>
        </BusinessProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  )
} 