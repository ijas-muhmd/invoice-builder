"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit2, Trash2, Palette } from "lucide-react"
import { useFinancial, Category } from "@/contexts/financial-context"
import { toast } from "@/components/ui/use-toast"

interface CategoryManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const categoryColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', 
  '#06b6d4', '#84cc16', '#6b7280', '#ec4899', '#f97316',
  '#14b8a6', '#8b5cf6', '#6366f1', '#a855f7', '#d946ef'
]

export function CategoryManagementDialog({ open, onOpenChange }: CategoryManagementDialogProps) {
  const { 
    getExpenseCategories, 
    getIncomeCategories, 
    addExpenseCategory, 
    addIncomeCategory,
    updateExpenseCategory,
    updateIncomeCategory,
    deleteExpenseCategory,
    deleteIncomeCategory
  } = useFinancial()

  const [activeTab, setActiveTab] = useState<"expenses" | "income">("expenses")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: categoryColors[0]
  })

  const expenseCategories = getExpenseCategories()
  const incomeCategories = getIncomeCategories()

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setFormData({
      name: "",
      description: "",
      color: categoryColors[0]
    })
    setIsCreating(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color
    })
    setIsCreating(true)
  }

  const handleSaveCategory = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required.",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategory: Category = {
          ...editingCategory,
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color
        }

        if (editingCategory.type === 'expense') {
          updateExpenseCategory(updatedCategory)
        } else {
          updateIncomeCategory(updatedCategory)
        }

        toast({
          title: "Category updated",
          description: `${formData.name} has been updated successfully.`,
        })
      } else {
        // Create new category
        const newCategory = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          type: activeTab === 'expenses' ? 'expense' as const : 'income' as const
        }

        if (activeTab === 'expenses') {
          addExpenseCategory(newCategory)
        } else {
          addIncomeCategory(newCategory)
        }

        toast({
          title: "Category created",
          description: `${formData.name} has been created successfully.`,
        })
      }

      setIsCreating(false)
      setEditingCategory(null)
      setFormData({
        name: "",
        description: "",
        color: categoryColors[0]
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save category. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCategory = (category: Category) => {
    try {
      if (category.type === 'expense') {
        deleteExpenseCategory(category.id)
      } else {
        deleteIncomeCategory(category.id)
      }

      toast({
        title: "Category deleted",
        description: `${category.name} has been deleted successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive"
      })
    }
  }

  const CategoryList = ({ categories, type }: { categories: Category[], type: 'expense' | 'income' }) => (
    <div className="space-y-3">
      {categories.map((category) => (
        <Card key={category.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div>
                <div className="font-medium">{category.name}</div>
                {category.description && (
                  <div className="text-sm text-muted-foreground">
                    {category.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={type === 'expense' ? 'destructive' : 'secondary'} className={type === 'income' ? 'bg-green-100 text-green-700' : ''}>
                {type === 'expense' ? 'Expense' : 'Income'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditCategory(category)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteCategory(category)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      {categories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No {type} categories found.</p>
          <p className="text-sm mt-1">Create your first {type} category to get started.</p>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add, edit, or delete your income and expense categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "expenses" | "income")}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="expenses">
                  Expense Categories ({expenseCategories.length})
                </TabsTrigger>
                <TabsTrigger value="income">
                  Income Categories ({incomeCategories.length})
                </TabsTrigger>
              </TabsList>
              <Button onClick={handleCreateCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab === 'expenses' ? 'Expense' : 'Income'} Category
              </Button>
            </div>

            <TabsContent value="expenses" className="space-y-4">
              <CategoryList categories={expenseCategories} type="expense" />
            </TabsContent>

            <TabsContent value="income" className="space-y-4">
              <CategoryList categories={incomeCategories} type="income" />
            </TabsContent>
          </Tabs>
        </div>

        {/* Category Creation/Edit Form */}
        {isCreating && (
          <div className="border-t pt-6 mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {editingCategory ? 'Edit Category' : `Add New ${activeTab === 'expenses' ? 'Expense' : 'Income'} Category`}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingCategory(null)
                  }}
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Category Name *</Label>
                  <Input
                    id="category-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Office Supplies, Consulting"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-color">Color</Label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: formData.color }}
                    />
                    <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span>{color}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this category..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingCategory(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveCategory}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 