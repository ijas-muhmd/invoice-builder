"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Coffee, Heart, Github, X } from "lucide-react"

export function SupportBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Show banner every 24 hours
    const lastShown = localStorage.getItem('support-banner-shown')
    if (!lastShown || Date.now() - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
      setShowBanner(true)
      localStorage.setItem('support-banner-shown', Date.now().toString())
    }
  }, [])

  if (!mounted) return null

  return (
    <Dialog open={showBanner} onOpenChange={setShowBanner}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col items-center text-center p-4 space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold">Support Invoicify</h2>
          <p className="text-muted-foreground">
            We keep Invoicify free, private, and ad-free. If you find it useful, consider supporting its development.
          </p>
          <div className="flex flex-col w-full gap-2">
            <a 
              href="https://github.com/yourusername/invoicify" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full">
                <Github className="mr-2 h-4 w-4" />
                Star on GitHub
              </Button>
            </a>
            <a 
              href="https://buymeacoffee.com/yourusername" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button className="w-full">
                <Coffee className="mr-2 h-4 w-4" />
                Buy me a coffee
              </Button>
            </a>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground"
            onClick={() => setShowBanner(false)}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 