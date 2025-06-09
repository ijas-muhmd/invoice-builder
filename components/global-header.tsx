"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  FileText, 
  ChevronDown, 
  Calculator,
  Receipt,
  CreditCard,
  TrendingUp,
  Building,
  Grid3X3,
  ExternalLink,
  Zap,
  CheckSquare
} from "lucide-react"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { useTasks } from "@/contexts/task-context"

interface Product {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  status: 'active' | 'coming-soon' | 'beta'
  isExternal?: boolean
}

const products: Product[] = [
  {
    id: 'invoice-builder',
    name: 'Invoice Builder',
    description: 'Create professional invoices instantly',
    icon: FileText,
    href: '/',
    status: 'active'
  },
  {
    id: 'financial-tracker',
    name: 'Financial Tracker',
    description: 'Track income and expenses for complete financial management',
    icon: Receipt,
    href: '/expenses',
    status: 'active'
  },
  {
    id: 'task-manager',
    name: 'Task Manager',
    description: 'Manage your daily tasks and track progress',
    icon: CheckSquare,
    href: '/tasks',
    status: 'active'
  },
  {
    id: 'payment-processor',
    name: 'Payment Processor',
    description: 'Accept payments from customers',
    icon: CreditCard,
    href: '/payments',
    status: 'coming-soon'
  },
  {
    id: 'analytics-dashboard',
    name: 'Business Analytics',
    description: 'Insights and reports for your business',
    icon: TrendingUp,
    href: '/analytics',
    status: 'beta'
  },
  {
    id: 'quote-generator',
    name: 'Quote Generator',
    description: 'Create quotes and estimates',
    icon: Calculator,
    href: '/quotes',
    status: 'coming-soon'
  },
  {
    id: 'crm-system',
    name: 'Customer CRM',
    description: 'Manage customer relationships',
    icon: Building,
    href: '/crm',
    status: 'coming-soon'
  }
]

interface GlobalHeaderProps {
  className?: string
}

export function GlobalHeader({ className }: GlobalHeaderProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { tasks } = useTasks()

  // Calculate pending tasks count
  const pendingTasksCount = tasks.filter(task => task.status === 'pending').length

  // Determine current product based on pathname
  const getCurrentProduct = () => {
    if (pathname === '/' || pathname.startsWith('/invoice') || pathname.startsWith('/customers')) {
      return products.find(p => p.id === 'invoice-builder')
    }
    
    if (pathname.startsWith('/expenses')) {
      return products.find(p => p.id === 'financial-tracker')
    }

    if (pathname.startsWith('/tasks')) {
      return products.find(p => p.id === 'task-manager')
    }
    
    return products.find(p => pathname.startsWith(p.href)) || products[0]
  }

  const currentProduct = getCurrentProduct()

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return null
      case 'beta':
        return <Badge variant="secondary" className="text-xs ml-2">Beta</Badge>
      case 'coming-soon':
        return <Badge variant="outline" className="text-xs ml-2">Soon</Badge>
    }
  }

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'text-foreground'
      case 'beta':
        return 'text-blue-600'
      case 'coming-soon':
        return 'text-muted-foreground'
    }
  }

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 border-b bg-background border-border shadow-sm", className)}>
      <div className="flex h-14 items-center px-6 w-full">
        {/* Product Switcher - First */}
        <div className="flex items-center space-x-6">
          <TooltipProvider>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-auto p-2 hover:bg-accent focus:bg-accent">
                      <div className="flex items-center space-x-2">
                        {currentProduct && (
                          <>
                            <currentProduct.icon className="h-4 w-4" />
                            <span className="font-medium">{currentProduct.name}</span>
                            {getStatusBadge(currentProduct.status)}
                            {currentProduct.id === 'task-manager' && pendingTasksCount > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {pendingTasksCount}
                              </Badge>
                            )}
                          </>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Switch between Invoice Builder and Financial Tracker</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" className="w-80">
                <div className="p-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">Switch Products</p>
                    <Badge variant="outline" className="text-xs">
                      {products.filter(p => p.status === 'active').length} Active
                    </Badge>
                  </div>
                  <div className="grid gap-1">
                    {products.map((product) => {
                      const isActive = currentProduct?.id === product.id
                      const isDisabled = product.status === 'coming-soon'
                      const isTaskManager = product.id === 'task-manager'
                      const taskCount = isTaskManager ? pendingTasksCount : 0
                      
                      const ProductItem = ({ children }: { children: React.ReactNode }) => (
                        <div
                          className={cn(
                            "flex items-start space-x-3 rounded-md p-3 transition-colors",
                            isActive && "bg-accent",
                            !isDisabled && "hover:bg-accent cursor-pointer",
                            isDisabled && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          {children}
                        </div>
                      )

                      const content = (
                        <ProductItem>
                          <product.icon className={cn("h-5 w-5 mt-0.5", getStatusColor(product.status))} />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className={cn("text-sm font-medium", getStatusColor(product.status))}>
                                {product.name}
                              </p>
                              {isTaskManager && taskCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                  {taskCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {product.description}
                            </p>
                          </div>
                        </ProductItem>
                      )

                      if (isDisabled) {
                        return content
                      }

                      return (
                        <Link
                          key={product.id}
                          href={product.href}
                          onClick={() => setIsOpen(false)}
                        >
                          {content}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>

        {/* Current Product Description */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {currentProduct?.description}
          </p>
        </div>

        {/* Workspace Switcher - Last */}
        <div className="flex items-center space-x-4">
          <WorkspaceSwitcher />
        </div>
      </div>
    </header>
  )
} 