"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Settings, Palette, DollarSign, Banknote } from "lucide-react"
import { useFinancial } from "@/contexts/financial-context"
import { CurrencySettings } from "@/components/currency-settings"
import { CurrencyConverter } from "@/components/currency-converter"
import { PaymentMethodList } from "@/components/payment-method-list"
import { Transaction } from "@/contexts/financial-context"

export default function SettingsPage() {
  const { getExpenseCategories, getIncomeCategories, transactions, getTransactionsByType } = useFinancial()
  
  const income = getTransactionsByType('income')
  const expenses = transactions.filter(t => t.type === 'expense')
  const expenseCategories = getExpenseCategories()
  const incomeCategories = getIncomeCategories()
  const allCategories = [...expenseCategories, ...incomeCategories]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financial Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage categories, preferences, and system settings
            </p>
          </div>
          <div className="flex gap-3">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Main Settings Tabs */}
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="categories" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Categories</span>
            </TabsTrigger>
            <TabsTrigger value="currency" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Currency</span>
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="flex items-center space-x-2">
              <Banknote className="w-4 h-4" />
              <span>Payment Methods</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>General</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            {/* Categories Management */}
            <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Financial Categories</CardTitle>
                  <CardDescription>Manage your income and expense categories separately</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Palette className="w-4 h-4 mr-2" />
                  Customize Colors
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="expenses" className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="expenses">
                      Expense Categories ({expenseCategories.length})
                    </TabsTrigger>
                    <TabsTrigger value="income">
                      Income Categories ({incomeCategories.length})
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense Category
                    </Button>
                    <Button size="sm" variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Income Category
                    </Button>
                  </div>
                </div>

                <TabsContent value="expenses">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenseCategories.map((category) => {
                      const categoryExpenses = expenses.filter(exp => exp.category === category.id)
                      const categoryExpenseTotal = categoryExpenses.reduce((sum: number, exp: Transaction) => sum + exp.amount, 0)
                      
                      return (
                        <Card key={category.id} className="p-4 hover:bg-muted/50 transition-colors border-red-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-semibold">{category.name}</span>
                            </div>
                            <Badge variant="destructive" className="text-xs">
                              Expense
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {category.description || 'No description provided'}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-red-600">Total Spent:</span>
                              <span className="font-semibold text-red-600">${categoryExpenseTotal.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground pt-1 border-t">
                              {categoryExpenses.length} transaction{categoryExpenses.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2 mt-3">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              Delete
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="income">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {incomeCategories.map((category) => {
                      const categoryIncome = income.filter(inc => inc.category === category.id)
                      const categoryIncomeTotal = categoryIncome.reduce((sum: number, inc: Transaction) => sum + inc.amount, 0)
                      
                      return (
                        <Card key={category.id} className="p-4 hover:bg-muted/50 transition-colors border-green-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-semibold">{category.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              Income
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {category.description || 'No description provided'}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">Total Earned:</span>
                              <span className="font-semibold text-green-600">${categoryIncomeTotal.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground pt-1 border-t">
                              {categoryIncome.length} transaction{categoryIncome.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2 mt-3">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              Delete
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          </TabsContent>

          <TabsContent value="currency" className="space-y-6">
            <CurrencySettings />
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-6">
            <PaymentMethodList />
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            {/* General Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export & Import</CardTitle>
                <CardDescription>Manage your financial data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Export Data</div>
                    <div className="text-sm text-muted-foreground">Download your financial data</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Export CSV
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Import Data</div>
                    <div className="text-sm text-muted-foreground">Upload transactions from file</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Import CSV
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Backup Data</div>
                    <div className="text-sm text-muted-foreground">Create a full backup</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Backup
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your financial tracker</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CurrencySettings />
                
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Default Currency</div>
                    <div className="text-sm text-muted-foreground">USD</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Date Format</div>
                    <div className="text-sm text-muted-foreground">MM/DD/YYYY</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Theme</div>
                    <div className="text-sm text-muted-foreground">Auto (System)</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Currency Converter</CardTitle>
                <CardDescription>Test currency conversions with current exchange rates</CardDescription>
              </CardHeader>
              <CardContent>
                <CurrencyConverter />
              </CardContent>
            </Card>
          </div>

          {/* Data Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Data Overview</CardTitle>
              <CardDescription>Summary of your financial data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-green-600">{income.length}</div>
                  <div className="text-sm text-muted-foreground">Income Records</div>
                </div>
                
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-red-600">{expenses.length}</div>
                  <div className="text-sm text-muted-foreground">Expense Records</div>
                </div>
                
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-blue-600">{allCategories.length}</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
                
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{income.length + expenses.length}</div>
                  <div className="text-sm text-muted-foreground">Total Transactions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 