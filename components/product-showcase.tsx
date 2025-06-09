"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Calculator,
  Receipt,
  CreditCard,
  TrendingUp,
  Building,
  ExternalLink,
  Zap,
  CheckCircle
} from "lucide-react"

const products = [
  {
    id: 'invoice-builder',
    name: 'Invoice Builder',
    description: 'Create professional invoices instantly with customizable templates, multi-currency support, and automatic calculations.',
    icon: FileText,
    status: 'active' as const,
    features: ['Professional Templates', 'Multi-Currency', 'Auto-Save', 'PDF Export', 'Customer Management'],
    color: 'text-green-600'
  },
  {
    id: 'expense-tracker',
    name: 'Expense Tracker',
    description: 'Track and categorize your business expenses with receipt scanning and automated reporting.',
    icon: Receipt,
    status: 'coming-soon' as const,
    features: ['Receipt Scanning', 'Category Management', 'Monthly Reports', 'Tax Preparation', 'Mobile App'],
    color: 'text-muted-foreground'
  },
  {
    id: 'payment-processor',
    name: 'Payment Processor',
    description: 'Accept payments from customers with integrated payment gateways and automated reconciliation.',
    icon: CreditCard,
    status: 'coming-soon' as const,
    features: ['Online Payments', 'Payment Links', 'Subscription Billing', 'Automated Reconciliation'],
    color: 'text-muted-foreground'
  },
  {
    id: 'analytics-dashboard',
    name: 'Business Analytics',
    description: 'Get insights into your business performance with comprehensive reports and visualizations.',
    icon: TrendingUp,
    status: 'beta' as const,
    features: ['Revenue Analytics', 'Customer Insights', 'Forecasting', 'Custom Reports', 'Real-time Data'],
    color: 'text-blue-600'
  },
  {
    id: 'quote-generator',
    name: 'Quote Generator',
    description: 'Create professional quotes and estimates that convert into invoices seamlessly.',
    icon: Calculator,
    status: 'coming-soon' as const,
    features: ['Professional Quotes', 'Convert to Invoice', 'Approval Workflow', 'Template Library'],
    color: 'text-muted-foreground'
  },
  {
    id: 'crm-system',
    name: 'Customer CRM',
    description: 'Manage customer relationships with contact management, communication history, and sales tracking.',
    icon: Building,
    status: 'coming-soon' as const,
    features: ['Contact Management', 'Communication History', 'Sales Pipeline', 'Follow-up Reminders'],
    color: 'text-muted-foreground'
  }
]

const getStatusBadge = (status: 'active' | 'coming-soon' | 'beta') => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>
    case 'beta':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Beta</Badge>
    case 'coming-soon':
      return <Badge variant="outline">Coming Soon</Badge>
  }
}

export function ProductShowcase() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold">BusinessSuite</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A complete business management platform with integrated tools for invoicing, 
          expense tracking, payments, and analytics.
        </p>
      </div>

      {/* Current Active Product */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-green-800">Invoice Builder - Currently Active</CardTitle>
                <CardDescription className="text-green-700">
                  You're currently using our professional invoice builder
                </CardDescription>
              </div>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products[0].features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <product.icon className={`h-8 w-8 ${product.color}`} />
                {getStatusBadge(product.status)}
              </div>
              <CardTitle className="flex items-center space-x-2">
                <span>{product.name}</span>
                {product.status === 'coming-soon' && (
                  <ExternalLink className="h-4 w-4 opacity-50" />
                )}
              </CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${
                        product.status === 'active' ? 'bg-green-500' :
                        product.status === 'beta' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full" 
                  variant={product.status === 'active' ? 'default' : 'outline'}
                  disabled={product.status === 'coming-soon'}
                >
                  {product.status === 'active' ? 'Current Product' :
                   product.status === 'beta' ? 'Try Beta' : 'Notify When Ready'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Why Choose BusinessSuite?</CardTitle>
          <CardDescription>
            Built for modern businesses who need integrated tools that work together seamlessly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">🔄 Seamless Integration</h4>
              <p className="text-sm text-muted-foreground">
                All tools work together - convert quotes to invoices, track expenses, and get unified analytics.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">📱 Modern Interface</h4>
              <p className="text-sm text-muted-foreground">
                Clean, intuitive design that works on all devices with offline capabilities.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔒 Secure & Private</h4>
              <p className="text-sm text-muted-foreground">
                Your data stays secure with local storage and encrypted backups.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚡ Performance First</h4>
              <p className="text-sm text-muted-foreground">
                Fast, responsive experience with instant saving and real-time updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 