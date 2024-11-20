"use client"

import { useState } from "react"
import { useTemplate } from "@/contexts/template-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Star, StarOff, Copy, Pencil, Trash2, FileText } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TemplateEditor } from "@/components/template-editor"

export default function TemplatesPage() {
  const { currentWorkspace } = useWorkspace()
  const { templates, getWorkspaceTemplates, addTemplate, duplicateTemplate, setDefaultTemplate } = useTemplate()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)

  const workspaceTemplates = currentWorkspace 
    ? getWorkspaceTemplates(currentWorkspace.id)
    : []

  const handleAddTemplate = () => {
    setEditingTemplate(null)
    setShowAddDialog(true)
  }

  if (workspaceTemplates.length === 0) {
    return (
      <div className="container mx-auto p-8">
        <EmptyState
          icon={FileText}
          title="No invoice templates"
          description="Create your first invoice template to get started"
          action={{
            label: "Create Template",
            onClick: handleAddTemplate
          }}
        />
        <TemplateEditor
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          templateId={editingTemplate}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invoice Templates</h1>
          <p className="text-muted-foreground">
            Manage and customize your invoice templates
          </p>
        </div>
        <Button onClick={handleAddTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaceTemplates.map((template) => (
          <Card key={template.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {template.sections.filter(s => s.show).length} sections enabled
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDefaultTemplate(template.id)}
                  disabled={template.isDefault}
                  title={template.isDefault ? "Default template" : "Set as default"}
                >
                  {template.isDefault ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => duplicateTemplate(template.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingTemplate(template.id)
                    setShowAddDialog(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Enabled Sections</div>
              <div className="grid grid-cols-2 gap-2">
                {template.sections
                  .filter(section => section.show)
                  .sort((a, b) => a.order - b.order)
                  .map(section => (
                    <div
                      key={section.id}
                      className="text-sm px-2 py-1 bg-muted rounded"
                    >
                      {section.name}
                    </div>
                  ))
                }
              </div>
            </div>

            {template.customFields.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Custom Fields</div>
                <div className="grid grid-cols-2 gap-2">
                  {template.customFields.map(field => (
                    <div
                      key={field.id}
                      className="text-sm px-2 py-1 bg-muted rounded"
                    >
                      {field.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <TemplateEditor
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        templateId={editingTemplate}
      />
    </div>
  )
} 