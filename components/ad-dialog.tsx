"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface AdDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export function AdDialog({ open, onOpenChange, onContinue }: AdDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Initialize ads when dialog opens
    if (open && mounted) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('Error loading ads:', err);
      }
    }
  }, [open, mounted]);

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thank You for Using Our Service</DialogTitle>
          <DialogDescription className="pt-4 space-y-4">
            <p>
              We strive to keep this invoice builder completely free for everyone. Your support by viewing relevant ads helps us maintain and improve this service.
            </p>
            <p>
              Please consider checking out ads that interest you - it's a small gesture that helps keep this tool free for the community.
            </p>
            <div className="my-4 p-2 border rounded-lg">
              <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client="ca-pub-5677909398957197"
                data-ad-slot="your-ad-slot-id"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </div>
            <Button 
              onClick={() => {
                onContinue()
                onOpenChange(false)
              }}
              className="w-full"
            >
              Continue to Preview
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
} 