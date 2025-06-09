"use client";

import { CategoryManagementDialog } from "@/components/category-management-dialog";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";

export function InvoicePreferences() {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Category Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5" />
            <h3 className="text-lg font-medium">Category Management</h3>
          </div>
          <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Manage Categories
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Add, edit, or remove your invoice and expense categories.
        </p>
        <CategoryManagementDialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog} />
      </Card>
      {/* Add more invoice-related settings here as needed */}
    </div>
  );
} 