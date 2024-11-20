"use client"

import { useTheme } from "next-themes"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function AppearancePreferences() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Theme</Label>
        <RadioGroup
          defaultValue={theme}
          onValueChange={(value) => setTheme(value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light">Light</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark">Dark</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="system" id="system" />
            <Label htmlFor="system">System</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
} 