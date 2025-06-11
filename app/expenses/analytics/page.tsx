"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpenseStats } from "@/components/expense-stats"
import { ExpenseChart } from "@/components/expense-chart"
import { TrendingUp, BarChart3, PieChart } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-foreground">Financial Analytics</h1>
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Detailed insights into your income and expenses
          </p>
          
          {/* Quick Action Buttons */}
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </button>
            <button className="inline-flex items-center px-6 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              Export Data
            </button>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="space-y-6">
          {/* Main Statistics Card */}
          <Card className="border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-medium text-foreground">Financial Statistics</CardTitle>
                  <CardDescription className="text-muted-foreground">Comprehensive breakdown of your financial data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ExpenseStats />
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Trends Chart */}
            <Card className="border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium text-foreground">Spending Trends</CardTitle>
                    <CardDescription className="text-muted-foreground">Monthly expense trends over time</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ExpenseChart type="trend" />
              </CardContent>
            </Card>

            {/* Category Breakdown Chart */}
            <Card className="border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium text-foreground">Category Breakdown</CardTitle>
                    <CardDescription className="text-muted-foreground">Expenses distributed by category</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ExpenseChart type="category" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 