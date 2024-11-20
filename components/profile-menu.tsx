"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, User, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useBusiness } from "@/contexts/business-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { PreferencesDialog } from "@/components/preferences-dialog"

export function ProfileMenu() {
  const [mounted, setMounted] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const { currentWorkspace } = useWorkspace()
  const { getDefaultBusiness } = useBusiness()

  const defaultBusiness = currentWorkspace 
    ? getDefaultBusiness(currentWorkspace.id)
    : null

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This will remove all invoices, customers, and drafts but keep your business details.')) {
      // Save business details temporarily
      const businessDetails = localStorage.getItem('businesses');
      
      // Clear all localStorage
      localStorage.clear();
      
      // Restore business details
      if (businessDetails) {
        localStorage.setItem('businesses', businessDetails);
      }

      // Refresh the page to reset all states
      window.location.reload();
    }
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="p-4 border-t mt-auto">
        <Button variant="ghost" className="w-full justify-start p-2 h-auto">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Set Business Details</span>
            <span className="text-xs text-muted-foreground">Configure default details</span>
          </div>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 border-t mt-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-2 h-auto relative group">
            <Avatar className="h-8 w-8 mr-2">
              {defaultBusiness?.logo ? (
                <AvatarImage src={defaultBusiness.logo} />
              ) : (
                <AvatarFallback>
                  {defaultBusiness?.name?.[0] || <User className="h-4 w-4" />}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col items-start text-left overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {defaultBusiness?.name || "Set Default Business"}
                </span>
                <Settings className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs text-muted-foreground truncate w-full">
                {defaultBusiness?.email || "Configure business profiles"}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[240px]">
          <DropdownMenuLabel>Business Profile</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShowPreferences(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Preferences</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={clearAllData} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Clear All Data</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PreferencesDialog 
        open={showPreferences} 
        onOpenChange={setShowPreferences} 
      />
    </div>
  )
}