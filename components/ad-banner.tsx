"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, X, Coffee, Sparkles, Timer } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface AdBannerProps {
  tourCompleted?: boolean;
}

export function AdBanner({ tourCompleted }: AdBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [countdown, setCountdown] = useState(10) // 10 seconds countdown
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show banner when tour is completed and after 5 seconds
  useEffect(() => {
    if (!tourCompleted) return;

    const lastShown = localStorage.getItem('ad-banner-shown')
    const shouldShow = !lastShown || Date.now() - parseInt(lastShown) > 12 * 60 * 60 * 1000

    if (shouldShow) {
      const timer = setTimeout(() => {
        setShowBanner(true)
        localStorage.setItem('ad-banner-shown', Date.now().toString())
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [tourCompleted])

  // Countdown timer
  useEffect(() => {
    if (!showBanner || countdown === 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showBanner, countdown])

  if (!mounted) return null

  return (
    <Dialog open={showBanner} onOpenChange={(open) => {
      if (canClose) setShowBanner(open)
    }}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <div className="relative">
          {canClose && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 rounded-full bg-background/80 hover:bg-background/90"
              onClick={() => setShowBanner(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Video container */}
          <div className="aspect-video w-full bg-black">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&mute=1"
              title="Advertisement"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          {/* Fun message below video */}
          <div className="p-8 text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              <h3>Hey there, Invoice Ninja! 🚀</h3>
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We know ads are about as fun as doing taxes (which you probably need to do, by the way 😉), 
              but they help keep Invoicify free and our developers caffeinated! ☕️
            </p>
            <div className="space-y-4">
              {!canClose && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4 animate-pulse" />
                  <span>You can continue in {countdown} seconds</span>
                </div>
              )}
              <Progress value={((10 - countdown) / 10) * 100} className="w-full max-w-xs mx-auto" />
              <Button 
                size="lg"
                className="gap-2"
                onClick={() => setShowBanner(false)}
                disabled={!canClose}
              >
                {canClose ? (
                  "Continue Using Invoicify"
                ) : (
                  `Wait ${countdown}s to continue`
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              P.S. Your data is still 100% private. We're cool like that. 😎
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 