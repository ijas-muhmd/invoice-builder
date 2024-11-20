"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, HelpCircle, X, MessageCircle, ExternalLink, Mail } from "lucide-react"
import { useBusinessDetails } from "@/contexts/business-details-context"
import { useInvoices } from "@/contexts/invoice-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ProductTour } from "@/components/product-tour"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const onboardingSteps = [
  {
    id: 'business-profile',
    title: 'Set up your business profile',
    description: 'Add your business details to use them in your invoices',
    completed: false,
    action: () => {
      const profileMenu = document.querySelector('[data-tour="profile"]')
      if (profileMenu) {
        const button = profileMenu.querySelector('button')
        button?.click()
      }
    },
  },
  {
    id: 'first-invoice',
    title: 'Create your first invoice',
    description: 'Create and save your first invoice',
    completed: false,
    action: () => router.push('/'),
  },
  {
    id: 'manage-customers',
    title: 'Manage your customers',
    description: 'Add and manage your customer list',
    completed: false,
    action: () => router.push('/customers'),
  },
  {
    id: 'customize-template',
    title: 'Customize invoice template',
    description: 'Personalize your invoice with your logo and custom fields',
    completed: false,
    action: () => router.push('/'),
  },
] as const

const faqItems = [
  {
    question: "How do I create my first invoice?",
    answer: "Click the 'New Invoice' button in the sidebar to start creating your invoice. Fill in your business details, add customer information, and list your items. You can save it as a draft or finalize it right away."
  },
  {
    question: "Is my data secure?",
    answer: "Yes! All your data is stored locally on your device. We don't store any information on our servers, ensuring complete privacy and security."
  },
  {
    question: "Can I customize invoice fields?",
    answer: "Yes, you can customize the header labels in the invoice items section. Click on any header to edit it. These changes will be saved for future invoices."
  },
  {
    question: "How do I export my invoices?",
    answer: "You can export individual invoices as PDFs using the 'Export PDF' button. You can also export all your data from the preferences menu for backup."
  },
]

const supportLinks = [
  {
    title: "Documentation",
    description: "Read our comprehensive guides",
    icon: ExternalLink,
    href: "https://docs.example.com"
  },
  {
    title: "Community Forum",
    description: "Get help from the community",
    icon: MessageCircle,
    href: "https://community.example.com"
  },
  {
    title: "Email Support",
    description: "Contact our support team",
    icon: Mail,
    href: "mailto:support@example.com"
  }
]

export function HelpCenter() {
  const [minimized, setMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('help-center-minimized') === 'true'
    }
    return false
  })
  const [startTour, setStartTour] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('getting-started')
  const { businessDetails } = useBusinessDetails()
  const { invoices } = useInvoices()
  const router = useRouter()

  // Update steps completion status
  const updatedSteps = onboardingSteps.map(step => ({
    ...step,
    completed: step.id === 'business-profile' 
      ? Boolean(businessDetails.name && businessDetails.email && businessDetails.address)
      : step.id === 'first-invoice'
      ? invoices.length > 0
      : step.id === 'manage-customers'
      ? mounted ? Boolean(localStorage.getItem('customers')) : false
      : step.id === 'customize-template'
      ? mounted ? Boolean(localStorage.getItem('invoice-headers')) : false
      : false
  }))

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('help-center-minimized', minimized.toString())
    }
  }, [minimized, mounted])

  const handleMinimize = () => setMinimized(true)
  const handleMaximize = () => setMinimized(false)

  const completedSteps = updatedSteps.filter(step => step.completed).length
  const progress = (completedSteps / updatedSteps.length) * 100
  const allStepsCompleted = completedSteps === updatedSteps.length

  const handleTourStart = () => {
    setStartTour(true)
    setMinimized(true)
    router.push('/')
    setTimeout(() => {
      document.querySelector('[data-tour="new-invoice"]')?.scrollIntoView({ behavior: 'smooth' })
    }, 500)
  }

  if (!mounted) return null

  return (
    <>
      <div className={cn(
        "fixed bottom-4 right-4 w-[400px] rounded-lg shadow-lg bg-background border transition-all duration-300",
        minimized ? "translate-y-[120%] opacity-0" : "translate-y-0 opacity-100"
      )}>
        {/* Header Section */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">
                {allStepsCompleted ? "Help Center" : "Getting Started"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {allStepsCompleted 
                  ? "Get help and support for Invoicify"
                  : "Complete these steps to get started"
                }
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
        </div>

        {/* Tabs Navigation */}
        <div className="border-b px-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('getting-started')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === 'getting-started' 
                  ? "border-b-2 border-primary text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Getting Started
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === 'help' 
                  ? "border-b-2 border-primary text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Help & Support
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'getting-started' && (
            <div className="space-y-4">
              
              <div className="text-sm text-muted-foreground">
                {completedSteps} of {updatedSteps.length} completed
              </div>
              <Progress value={progress} className="h-2" />

              <div className="space-y-4">
                {updatedSteps.map((step) => (
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
                  className="w-full"
                  onClick={handleTourStart}
                >
                  Take a tour
                </Button>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-sm">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Support Resources</h3>
                <div className="grid gap-2">
                  {supportLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <link.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{link.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {link.description}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {minimized && (
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