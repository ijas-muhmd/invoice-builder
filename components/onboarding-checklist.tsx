"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, HelpCircle, X } from "lucide-react"
import { useBusinessDetails } from "@/contexts/business-details-context"
import { useInvoices } from "@/contexts/invoice-context"
import Joyride, { CallBackProps, STATUS } from 'react-joyride'
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ProductTour } from "@/components/product-tour"
import router from "next/router"
import { db } from "@/lib/db"
import { Building2, FileText, Users, PaintBucket } from "lucide-react"

interface Step {
  id: string
  title: string
  description: string
  completed: boolean
  icon: React.ComponentType
  action?: () => void
  href?: string
}

const initialSteps: Step[] = [
  {
    id: 'business-profile',
    title: 'Set up your business profile',
    description: 'Add your business details to appear on invoices',
    completed: false,
    icon: Building2,
    action: () => {
      const profileMenu = document.querySelector('[data-tour="profile"]')
      if (profileMenu) {
        const button = profileMenu.querySelector('button')
        button?.click()
      }
    },
    href: '#profile-menu'
  },
  {
    id: 'first-invoice',
    title: 'Create your first invoice',
    description: 'Create and send your first invoice to a client',
    completed: false,
    icon: FileText,
    action: () => router.push('/'),
    href: '/'
  },
  {
    id: 'manage-customers',
    title: 'Manage your customers',
    description: 'Add and manage your customer information',
    completed: false,
    icon: Users,
    action: () => router.push('/customers'),
    href: '/customers'
  },
  {
    id: 'customize-template',
    title: 'Customize your invoice template',
    description: 'Customize the look and feel of your invoices',
    completed: false,
    icon: PaintBucket,
    action: () => router.push('/'),
    href: '/'
  }
]

export function OnboardingChecklist() {
  const [minimized, setMinimized] = useState(false)
  const [startTour, setStartTour] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { businessDetails } = useBusinessDetails()
  const { invoices } = useInvoices()
  const router = useRouter()
  const [steps, setSteps] = useState<Step[]>(initialSteps)

  // Load minimized state from IndexedDB
  useEffect(() => {
    const loadMinimized = async () => {
      const saved = await db.get('settings', 'checklist-minimized')
      if (saved !== undefined) {
        setMinimized(saved)
      }
    }
    loadMinimized()
  }, [])

  // Save minimized state to IndexedDB
  useEffect(() => {
    const saveMinimized = async () => {
      if (mounted) {
        await db.set('settings', 'checklist-minimized', minimized)
      }
    }
    saveMinimized()
  }, [minimized, mounted])

  // Update steps completion status
  useEffect(() => {
    const updateSteps = async () => {
      const updatedSteps = await Promise.all(initialSteps.map(async (step: Step) => ({
    ...step,
    completed: step.id === 'business-profile' 
      ? Boolean(businessDetails.name && businessDetails.email && businessDetails.address)
      : step.id === 'first-invoice'
      ? invoices.length > 0
      : step.id === 'manage-customers'
          ? mounted ? Boolean(await db.get('settings', 'customers')) : false
      : step.id === 'customize-template'
          ? mounted ? Boolean(await db.get('settings', 'invoice-headers')) : false
      : false
      })))
      setSteps(updatedSteps)
    }
    updateSteps()
  }, [businessDetails, invoices, mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  const allStepsCompleted = steps.every(step => step.completed)
  if (allStepsCompleted) return null

  const handleMinimize = () => {
    setMinimized(true)
  }

  const handleMaximize = () => {
    setMinimized(false)
  }

  const handleTourStart = () => {
    setStartTour(true)
    setMinimized(true)
    router.push('/')
    setTimeout(() => {
      document.querySelector('[data-tour="new-invoice"]')?.scrollIntoView({ behavior: 'smooth' })
    }, 500)
  }

  if (!mounted) return null

  const completedSteps = steps.filter(step => step.completed).length
  const progress = (completedSteps / steps.length) * 100

  return (
    <>
      <div className={cn(
        "fixed bottom-4 right-4 w-[400px] rounded-lg shadow-lg bg-background border p-4 transition-all duration-300",
        minimized ? "translate-y-[120%] opacity-0" : "translate-y-0 opacity-100"
      )}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">Getting Started</h3>
            <p className="text-sm text-muted-foreground">
              Complete these steps to get the most out of your invoice builder
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleMinimize}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Progress value={progress} className="h-2 mb-4" />
        <div className="text-sm text-muted-foreground mb-4">
          {completedSteps} of {steps.length} completed
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={cn(
                "flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                "hover:bg-muted/50",
                step.completed && "opacity-70"
              )}
              onClick={() => {
                step.action?.();
                setMinimized(true);
              }}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {!startTour && (
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={handleTourStart}
          >
            Take a tour
          </Button>
        )}
      </div>

      {minimized && !startTour && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-background transition-all duration-300"
          onClick={handleMaximize}
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      )}

      <ProductTour 
        startTour={startTour}
        onTourStart={() => {
          setMinimized(true)
        }}
        onTourEnd={() => {
          setStartTour(false)
        }}
      />
    </>
  )
} 