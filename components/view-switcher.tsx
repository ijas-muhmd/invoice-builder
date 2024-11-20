"use client"

import { LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ViewSwitcherProps {
  view: 'board' | 'list'
  onViewChange: (view: 'board' | 'list') => void
}

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  return (
    <ToggleGroup type="single" value={view} onValueChange={(value) => value && onViewChange(value as 'board' | 'list')}>
      <ToggleGroupItem value="board" aria-label="Board view">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
} 