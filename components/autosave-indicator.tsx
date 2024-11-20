"use client"

import { useEffect } from "react"
import { Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface AutosaveIndicatorProps {
  saving: boolean
}

export function AutosaveIndicator({ saving }: AutosaveIndicatorProps) {
  return (
    <div
      className={cn(
        "fixed bottom-4 left-[288px] flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur transition-opacity duration-150",
        saving ? "opacity-100" : "opacity-0"
      )}
    >
      {saving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Saved</span>
        </>
      )}
    </div>
  )
} 