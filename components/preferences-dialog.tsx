"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Settings, PaintBucket, FileText, Bell, Lock, Database, Keyboard, Building2 } from "lucide-react"
import { useState, useEffect } from "react"
import { AppearancePreferences } from "./preferences/appearance-preferences"
import { BusinessPreferences } from "./preferences/business-preferences"
import { DataPreferences } from "./preferences/data-preferences"
import { SecurityPreferences } from "./preferences/security-preferences"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { BusinessManagement } from "./preferences/business-management"
import { BankAccountsManagement } from "./preferences/bank-accounts-management"

interface PreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SidebarItem {
  title: string
  icon: React.ElementType
  items: {
    title: string
    description?: string
    component: React.ReactNode
  }[]
}

export function PreferencesDialog({ open, onOpenChange }: PreferencesDialogProps) {
  const [showAddBusinessDialog, setShowAddBusinessDialog] = useState(false);
  const [preferences, setPreferences] = useLocalStorage('preferences', {
    pin: '',
    theme: 'system',
  })

  // Define sidebarItems first
  const sidebarItems: SidebarItem[] = [
    {
      title: "Appearance",
      icon: PaintBucket,
      items: [
        {
          title: "Theme",
          description: "Customize the look and feel of your invoice builder",
          component: <AppearancePreferences />
        }
      ]
    },
    {
      title: "Business",
      icon: Building2,
      items: [
        {
          title: "Business Profiles",
          description: "Manage business profiles in this workspace",
          component: <BusinessManagement 
            showAddDialog={showAddBusinessDialog} 
            setShowAddDialog={setShowAddBusinessDialog} 
          />
        }
      ]
    },
    // {
    //   title: "Security",
    //   icon: Lock,
    //   items: [
    //     {
    //       title: "App Protection",
    //       description: "Set up PIN protection for your data",
    //       component: <SecurityPreferences />
    //     }
    //   ]
    // },
    {
      title: "Data & Privacy",
      icon: Database,
      items: [
        {
          title: "Data Management",
          description: "Export or clear your data",
          component: <DataPreferences />
        }
      ]
    },
    {
      title: "Banking",
      icon: Building2,
      items: [
        {
          title: "Bank Accounts",
          description: "Manage your bank accounts",
          component: <BankAccountsManagement />
        }
      ]
    }
  ];

  // Then use it in state initialization
  const [selectedCategory, setSelectedCategory] = useState(sidebarItems[0]);
  const [selectedItem, setSelectedItem] = useState(sidebarItems[0].items[0]);

  // Autosave when preferences change
  useEffect(() => {
    localStorage.setItem('preferences', JSON.stringify(preferences))
  }, [preferences])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0">
        <div className="flex flex-col h-[600px]">
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar with ScrollArea */}
            <div className="w-[240px] border-r flex flex-col">
              <div className="p-4 border-b flex-shrink-0">
                <DialogTitle>Preferences</DialogTitle>
              </div>
              <ScrollArea className="flex-1">
                <div className="py-2">
                  {sidebarItems.map((category) => (
                    <div key={category.title}>
                      <div className="px-4 py-2">
                        <h3 className="mb-1 text-sm font-medium flex items-center gap-2 text-muted-foreground">
                          <category.icon className="h-4 w-4" />
                          {category.title}
                        </h3>
                        <div className="space-y-1">
                          {category.items.map((item) => (
                            <Button
                              key={item.title}
                              variant={selectedItem === item ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start",
                                selectedItem === item && "bg-muted"
                              )}
                              onClick={() => {
                                setSelectedCategory(category)
                                setSelectedItem(item)
                              }}
                            >
                              {item.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Content with ScrollArea */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b flex-shrink-0">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">{selectedItem.title}</h2>
                  {selectedItem.description && (
                    <p className="text-muted-foreground">
                      {selectedItem.description}
                    </p>
                  )}
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {selectedItem.component}
                </div>
              </ScrollArea>
            </div>
          </div>
          {/* Add footer */}
          <div className="p-4 border-t text-center text-sm text-muted-foreground flex-shrink-0">
            <p>Made with ❤️ by Invoice Maker <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">FREE</span></p>
            <p className="text-xs mt-1">
              <a 
                href="https://invoicemakerfree.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                invoicemakerfree.com
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 