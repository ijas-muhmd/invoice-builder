"use client"

import * as React from "react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CustomDatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  label?: string
  placeholder?: string
  id?: string
  className?: string
}

export function CustomDatePicker({
  value,
  onChange,
  label,
  placeholder = "Pick a date",
  id = "custom-date-picker",
  className,
}: CustomDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewDate, setViewDate] = React.useState<Date>(value || new Date())

  // Generate calendar grid
  const startMonth = startOfMonth(viewDate)
  const endMonthDate = endOfMonth(viewDate)
  const startDate = startOfWeek(startMonth, { weekStartsOn: 0 })
  const endDate = endOfWeek(endMonthDate, { weekStartsOn: 0 })
  const days: Date[] = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  // Month/year navigation
  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1))
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1))

  // Render
  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium px-1 mb-1">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            aria-label={label || placeholder}
            data-empty={!value}
            className={cn(
              "w-full h-10 justify-start text-left font-normal rounded-md border bg-background px-3",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
            {value ? format(value, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[340px] p-4" align="start">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={handlePrevMonth} className="p-1 rounded hover:bg-muted">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-medium">{format(viewDate, "MMMM yyyy")}</span>
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1 rounded hover:bg-muted">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const isSelected = value && isSameDay(d, value)
              const isCurrentMonth = isSameMonth(d, viewDate)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange?.(d)
                    setOpen(false)
                  }}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && isCurrentMonth && "hover:bg-accent hover:text-accent-foreground",
                    !isCurrentMonth && "text-muted-foreground opacity-50"
                  )}
                  tabIndex={isCurrentMonth ? 0 : -1}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 