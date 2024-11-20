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
import { useCustomers, type Customer } from "@/contexts/customer-context"

interface CustomerSelectProps {
  onSelect: (customer: Customer) => void
  value?: string
}

export function CustomerSelect({ onSelect, value }: CustomerSelectProps) {
  const [open, setOpen] = React.useState(false)
  const { customers } = useCustomers()
  const [selectedId, setSelectedId] = React.useState<string | undefined>(value)

  const selectedCustomer = React.useMemo(() => 
    customers.find(customer => customer.id === selectedId),
    [customers, selectedId]
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
          {selectedCustomer ? selectedCustomer.businessName : "Select customer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search customers..." />
          <CommandEmpty>No customer found.</CommandEmpty>
          <CommandGroup>
            {customers.map((customer) => (
              <CommandItem
                key={customer.id}
                value={customer.id}
                onSelect={() => {
                  setSelectedId(customer.id)
                  onSelect(customer)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedId === customer.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {customer.businessName}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 