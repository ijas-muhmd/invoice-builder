"use client"

import { useEffect, useState } from "react"
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

const steps: Step[] = [
  {
    target: '[data-tour="logo"]',
    content: 'Welcome to Invoice Builder! Let\'s take a quick tour of the main features.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="new-invoice"]',
    content: 'Create a new invoice by clicking here. You can save it as a draft or send it right away.',
    placement: 'right',
  },
  {
    target: '[data-tour="invoice-board"]',
    content: 'View and manage all your invoices in the board view. Drag and drop to change status.',
    placement: 'right',
  },
  {
    target: '[data-tour="customers"]',
    content: 'Manage your customer list here. Add, edit, and organize your clients.',
    placement: 'right',
  },
  {
    target: '[data-tour="recent-invoices"]',
    content: 'Quick access to your recent invoices. Click any to view or edit.',
    placement: 'right',
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: 'Switch between light and dark mode for comfortable viewing.',
    placement: 'left',
  },
  {
    target: '[data-tour="profile"]',
    content: 'Set up your business profile and default details here.',
    placement: 'top',
  },
  {
    target: '[data-tour="help"]',
    content: 'Access this tour again and view other helpful resources from here.',
    placement: 'left',
  },
]

interface ProductTourProps {
  startTour?: boolean;
  onTourStart?: () => void;
  onTourEnd?: () => void;
}

export function ProductTour({ startTour, onTourStart, onTourEnd }: ProductTourProps) {
  const [run, setRun] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only start tour when startTour prop changes to true
  useEffect(() => {
    if (startTour) {
      // Check if welcome message has been seen
      const hasSeenWelcome = localStorage.getItem('has-seen-intro')
      if (hasSeenWelcome) {
        setRun(true)
        onTourStart?.()
      }
    }
  }, [startTour, onTourStart])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      onTourEnd?.()
    }

    // Navigate to different pages based on the step
    if (status === STATUS.READY) {
      switch (index) {
        case 2: // Invoice Board step
          router.push('/invoices')
          break
        case 3: // Customers step
          router.push('/customers')
          break
        case 0: // First step
          router.push('/')
          break
      }
    }
  }

  if (!mounted) return null

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      showProgress
      showSkipButton
      spotlightPadding={4}
      disableOverlayClose
      hideCloseButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          zIndex: 1000,
          backgroundColor: theme === 'dark' ? 'hsl(var(--background))' : '#fff',
          textColor: theme === 'dark' ? 'hsl(var(--foreground))' : '#1e1f21',
          arrowColor: theme === 'dark' ? 'hsl(var(--background))' : '#fff',
        },
        spotlight: {
          borderRadius: '8px',
        },
        tooltip: {
          borderRadius: '8px',
          backgroundColor: theme === 'dark' ? 'hsl(var(--background))' : '#fff',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          color: theme === 'dark' ? 'hsl(var(--foreground))' : '#1e1f21',
        },
        tooltipContent: {
          color: theme === 'dark' ? 'hsl(var(--muted-foreground))' : '#71717a',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        },
        buttonBack: {
          color: theme === 'dark' ? 'hsl(var(--muted-foreground))' : '#71717a',
        },
        buttonSkip: {
          color: theme === 'dark' ? 'hsl(var(--muted-foreground))' : '#71717a',
        },
      }}
    />
  )
} 