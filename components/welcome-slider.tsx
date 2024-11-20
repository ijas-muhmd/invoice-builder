"use client"

import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Lock, Cloud, UserX, Database, FileText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const slides = [
  {
    title: "Create Beautiful Invoices",
    description: "Professional invoicing made simple and elegant",
    icon: Sparkles,
    content: (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-[gradient_10s_linear_infinite]" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-4">
          <FileText className="h-16 w-16 text-primary animate-pulse" />
          <div className="space-y-2">
            <p className="text-lg font-medium">No sign-up required</p>
            <p className="text-sm text-muted-foreground">Start creating invoices instantly</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Your Data, Your Control",
    description: "Complete privacy with local-first storage",
    icon: Database,
    content: (
      <div className="grid grid-cols-3 gap-4 p-6">
        <div className="col-span-3 space-y-2 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <Database className="h-16 w-16 text-primary" />
              <Lock className="h-6 w-6 text-green-500 absolute -right-2 -bottom-2" />
            </div>
          </div>
          <h4 className="font-medium">100% Local Storage</h4>
          <p className="text-sm text-muted-foreground">Your data never leaves your device</p>
        </div>
      </div>
    )
  },
  {
    title: "Works Offline",
    description: "Create invoices anytime, anywhere",
    icon: Cloud,
    content: (
      <div className="p-6 space-y-6">
        <div className="flex justify-center">
          <div className="relative animate-bounce">
            <Cloud className="h-16 w-16 text-primary" />
            <div className="absolute inset-0 animate-ping">
              <Cloud className="h-16 w-16 text-primary opacity-20" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="font-medium">No Internet?</p>
            <p className="text-sm text-muted-foreground">No problem!</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="font-medium">Always Available</p>
            <p className="text-sm text-muted-foreground">Work seamlessly</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Privacy First",
    description: "No tracking, no accounts, just invoicing",
    icon: Lock,
    content: (
      <div className="p-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-primary/20 blur-3xl" />
          <div className="relative bg-card rounded-lg p-6 space-y-4">
            <div className="flex justify-center">
              <UserX className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-2 text-center">
              <p className="font-medium">No Account Required</p>
              <p className="text-sm text-muted-foreground">Start using immediately</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="p-2 rounded-md bg-green-500/10 text-green-500">No Tracking</div>
              <div className="p-2 rounded-md bg-primary/10">No Analytics</div>
              <div className="p-2 rounded-md bg-primary/10">No Cookies</div>
              <div className="p-2 rounded-md bg-green-500/10 text-green-500">No Data Collection</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
]

interface WelcomeSliderProps {
  onComplete?: () => void;
}

export function WelcomeSlider({ onComplete }: WelcomeSliderProps) {
  const [open, setOpen] = React.useState(false)
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const hasSeenIntro = localStorage.getItem('has-seen-intro')
    if (!hasSeenIntro) {
      setOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem('has-seen-intro', 'true')
    setOpen(false)
    setTimeout(() => {
      onComplete?.()
    }, 500)
  }

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }
  }

  if (!mounted) return null

  const CurrentIcon = slides[currentSlide].icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="mb-2 p-4 bg-primary/10 rounded-full">
                  <CurrentIcon className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">{slides[currentSlide].title}</h2>
                <p className="text-muted-foreground">{slides[currentSlide].description}</p>
              </div>
            </div>

            {slides[currentSlide].content}

            <div className="p-6 flex items-center justify-between border-t bg-muted/50">
              <Button
                variant="ghost"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-1">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      index === currentSlide 
                        ? "w-8 bg-primary" 
                        : "w-1.5 bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <Button onClick={nextSlide}>
                {currentSlide === slides.length - 1 ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
} 