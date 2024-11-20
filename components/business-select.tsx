"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useBusiness, type Business } from "@/contexts/business-context"
import { useWorkspace } from "@/contexts/workspace-context"

interface BusinessSelectProps {
  onSelect: (business: Business) => void
  value?: string
}

export function BusinessSelect({ onSelect, value }: BusinessSelectProps) {
  const [open, setOpen] = React.useState(false)
  const { currentWorkspace } = useWorkspace()
  const { businesses, getWorkspaceBusinesses } = useBusiness()
  const [selectedId, setSelectedId] = React.useState<string | undefined>(value)

  const workspaceBusinesses = React.useMemo(() => 
    currentWorkspace ? getWorkspaceBusinesses(currentWorkspace.id) : [],
    [currentWorkspace, getWorkspaceBusinesses]
  )

  const selectedBusiness = React.useMemo(() => 
    businesses.find(business => business.id === selectedId),
    [businesses, selectedId]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedBusiness ? selectedBusiness.name : "Select business..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search businesses..." />
          <CommandEmpty>No business found.</CommandEmpty>
          <CommandGroup>
            {workspaceBusinesses.map((business) => (
              <CommandItem
                key={business.id}
                value={business.id}
                onSelect={() => {
                  setSelectedId(business.id)
                  onSelect(business)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedId === business.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {business.name}
                {business.isDefault && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 