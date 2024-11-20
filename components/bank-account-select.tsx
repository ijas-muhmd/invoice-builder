"use client"

import { Button } from "@/components/ui/button"
import { useBankAccounts } from "@/contexts/bank-accounts-context"
import { useWorkspace } from "@/contexts/workspace-context"
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
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"

interface BankAccountSelectProps {
  value?: string
  onSelect: (account: any) => void
}

export function BankAccountSelect({ value, onSelect }: BankAccountSelectProps) {
  const [open, setOpen] = useState(false)
  const { currentWorkspace } = useWorkspace()
  const { getWorkspaceBankAccounts } = useBankAccounts()

  const accounts = currentWorkspace 
    ? getWorkspaceBankAccounts(currentWorkspace.id)
    : []

  const selectedAccount = accounts.find(account => account.name === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? selectedAccount?.name
            : "Select bank account..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search bank accounts..." />
          <CommandEmpty>No bank account found.</CommandEmpty>
          <CommandGroup>
            {accounts.map((account) => (
              <CommandItem
                key={account.id}
                onSelect={() => {
                  onSelect(account)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === account.name ? "opacity-100" : "opacity-0"
                  )}
                />
                {account.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 