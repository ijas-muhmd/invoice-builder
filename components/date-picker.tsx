"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CustomDatePicker } from "@/components/custom-date-picker"

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  label?: string
  id?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  label,
  id = "date-picker",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium text-foreground px-1 mb-1"
        >
          {label}
        </label>
      )}
      <CustomDatePicker
        value={value}
        onChange={onChange}
        label={label}
        placeholder={placeholder}
      />
    </div>
  )
}