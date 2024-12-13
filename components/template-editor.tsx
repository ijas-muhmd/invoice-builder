"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTemplate, type Template, type CustomField } from "@/contexts/template-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { GripVertical, Plus, X, Eye, ChevronDown, ChevronRight, Settings2, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Preview } from "@/components/preview"
import { useForm } from "react-hook-form"
import { type InvoiceFormValues } from "@/app/invoice-schema"
import { cn } from "@/lib/utils"

// Define default fields for each section
const defaultSectionFields = {
  business: [
    { id: "name", label: "Business Name", type: "text" },
    { id: "email", label: "Email", type: "text" },
    { id: "address", label: "Address", type: "text" },
    { id: "phone", label: "Phone", type: "text" },
    { id: "taxNumber", label: "Tax Number", type: "text" },
    { id: "postalCode", label: "Postal Code", type: "text" },
  ],
  customer: [
    { id: "businessName", label: "Business Name", type: "text" },
    { id: "email", label: "Email", type: "text" },
    { id: "address", label: "Address", type: "text" },
    { id: "phone", label: "Phone", type: "text" },
  ],
  invoice: [
    { id: "number", label: "Invoice Number", type: "text" },
    { id: "date", label: "Issue Date", type: "date" },
    { id: "dueDate", label: "Due Date", type: "date" },
    { id: "paymentTerms", label: "Payment Terms", type: "text" },
    { id: "poNumber", label: "PO Number", type: "text" },
  ],
  items: [
    { id: "description", label: "Description", type: "text" },
    { id: "quantity", label: "Quantity", type: "number" },
    { id: "rate", label: "Rate", type: "number" },
    { id: "amount", label: "Amount", type: "number" },
  ],
}

interface TemplateEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId?: string | null
}

const demoInvoiceData: InvoiceFormValues = {
  logo: "",
  number: "INV-001",
  date: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  paymentTerms: "Net 30",
  poNumber: "PO-12345",
  currency: "USD",
  from: {
    name: "Acme Inc.",
    email: "billing@acme.com",
    address: "123 Business Street\nSuite 100\nNew York, NY 10001",
    phone: "+1 (555) 123-4567",
    taxNumber: "TAX-123456",
    postalCode: "10001",
  },
  to: {
    businessName: "Client Corp",
    address: "456 Customer Avenue\nLos Angeles, CA 90001",
    optional: "Reference: Project X",
  },
  items: [
    { description: "Web Development Services", quantity: 40, rate: 150 },
    { description: "UI/UX Design", quantity: 20, rate: 200 },
    { description: "Server Hosting (Monthly)", quantity: 1, rate: 99 },
  ],
  tax: 10,
  shipping: 0,
  discount: 500,
  amountPaid: 0,
  notes: "Thank you for your business!",
  terms: "Payment is due within 30 days",
  itemLabels: {
    description: "Description",
    quantity: "Quantity",
    price: "Rate",
    amount: "Amount",
  },
}

// Define built-in sections that can only be toggled
const builtInSections = {
  logo: {
    id: "logo",
    name: "Logo",
    description: "Your business logo",
    removable: false,
  },
  title: {
    id: "title",
    name: "Invoice Title",
    description: "Invoice header and number",
    removable: false,
  },
  business: {
    id: "business",
    name: "Business Details",
    description: "Your company information",
    removable: false,
  },
  customer: {
    id: "customer",
    name: "Customer Details",
    description: "Client billing information",
    removable: false,
  },
  dates: {
    id: "dates",
    name: "Dates & Numbers",
    description: "Invoice and due dates",
    removable: false,
  },
  items: {
    id: "items",
    name: "Line Items",
    description: "Products or services",
    removable: false,
  },
  totals: {
    id: "totals",
    name: "Totals",
    description: "Subtotal, tax, and total",
    removable: false,
  },
  notes: {
    id: "notes",
    name: "Notes",
    description: "Additional information",
    removable: true,
  },
  terms: {
    id: "terms",
    name: "Terms",
    description: "Payment terms and conditions",
    removable: true,
  },
} as const

// Update section categories to reference built-in sections
const sectionCategories = {
  header: {
    title: "Header Section",
    description: "Customize the top section of your invoice",
    sections: ["logo", "title"],
    allowNewSections: true,
  },
  details: {
    title: "Business & Customer Details",
    description: "Manage business and customer information sections",
    sections: ["business", "customer"],
    allowNewSections: false, // Don't allow new sections in critical areas
  },
  invoice: {
    title: "Invoice Information",
    description: "Configure invoice-specific sections",
    sections: ["dates", "items", "totals"],
    allowNewSections: false,
  },
  footer: {
    title: "Footer Section",
    description: "Customize the bottom section of your invoice",
    sections: ["notes", "terms"],
    allowNewSections: true,
  },
}

// Define field types with icons and descriptions
const fieldTypes = [
  { value: "text", label: "Text", description: "Single line text input" },
  { value: "number", label: "Number", description: "Numeric input field" },
  { value: "date", label: "Date", description: "Date picker field" },
  { value: "select", label: "Dropdown", description: "Selection from options" },
]

// Add this new component for form preview
function FormPreview({ sections, customFields }: { 
  sections: Template["sections"],
  customFields: CustomField[]
}) {
  return (
    <div className="p-6 space-y-8">
      <div className="max-w-xl mx-auto space-y-8">
        {sections
          .filter(section => section.show)
          .sort((a, b) => a.order - b.order)
          .map(section => (
            <div key={section.id} className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <h3 className="text-lg font-medium">{section.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {section.id === 'business' && 'Your business information'}
                    {section.id === 'customer' && 'Customer billing information'}
                    {section.id === 'dates' && 'Invoice dates and numbers'}
                    {section.id === 'items' && 'Invoice line items and details'}
                    {section.id === 'totals' && 'Calculations and totals'}
                    {section.id === 'notes' && 'Additional notes and terms'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {section.show ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>

              {/* Section Fields */}
              <div className="grid gap-4">
                {/* Default fields */}
                {defaultSectionFields[section.id as keyof typeof defaultSectionFields]?.map(field => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{field.label}</Label>
                      <span className="text-xs text-muted-foreground">
                        {field.type === 'text' && 'Text field'}
                        {field.type === 'number' && 'Number field'}
                        {field.type === 'date' && 'Date field'}
                        {field.type === 'select' && 'Dropdown field'}
                      </span>
                    </div>
                    <div className="relative">
                      {field.type === 'text' && (
                        <Input 
                          disabled 
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="bg-muted/50"
                        />
                      )}
                      {field.type === 'number' && (
                        <Input 
                          type="number" 
                          disabled 
                          placeholder="0"
                          className="bg-muted/50"
                        />
                      )}
                      {field.type === 'date' && (
                        <Input 
                          type="date" 
                          disabled
                          className="bg-muted/50"
                        />
                      )}
                      {field.type === 'select' && (
                        <Select disabled>
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}

                {/* Custom fields for this section */}
                {customFields
                  .filter(field => field.section === section.id)
                  .map(field => (
                    <div key={field.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{field.label || "Untitled Field"}</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {field.type === 'text' && 'Text field'}
                            {field.type === 'number' && 'Number field'}
                            {field.type === 'date' && 'Date field'}
                            {field.type === 'select' && 'Dropdown field'}
                          </span>
                          <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">
                            Custom
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        {field.type === 'text' && (
                          <Input 
                            disabled 
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="bg-muted/50"
                          />
                        )}
                        {field.type === 'number' && (
                          <Input 
                            type="number" 
                            disabled 
                            placeholder="0"
                            className="bg-muted/50"
                          />
                        )}
                        {field.type === 'date' && (
                          <Input 
                            type="date" 
                            disabled
                            className="bg-muted/50"
                          />
                        )}
                        {field.type === 'select' && (
                          <Select disabled>
                            <SelectTrigger className="bg-muted/50">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

interface SectionConfig {
  id: string
  name: string
  show: boolean
  order: number
  width: 'full' | 'half'
  alignment: 'left' | 'center' | 'right'
  padding: 'none' | 'small' | 'medium' | 'large'
  background: 'none' | 'muted' | 'primary' | 'card'
}

// Demo data toggle component
function DemoDataToggle({ onToggle }: { onToggle: (enabled: boolean) => void }) {
  const [enabled, setEnabled] = useState(false)

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="space-y-0.5">
        <div className="font-medium">Demo Data</div>
        <div className="text-sm text-muted-foreground">
          Use demo data to visualize your template
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={(checked) => {
          setEnabled(checked)
          onToggle(checked)
        }}
      />
    </div>
  )
}

// Section configuration dialog
function SectionConfigDialog({
  open,
  onOpenChange,
  section,
  onUpdate,
  isNew = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: Partial<SectionConfig>
  onUpdate: (section: SectionConfig) => void
  isNew?: boolean
}) {
  const [config, setConfig] = useState<SectionConfig>({
    id: section.id || crypto.randomUUID(),
    name: section.name || '',
    show: section.show ?? true,
    order: section.order ?? 0,
    width: section.width || 'full',
    alignment: section.alignment || 'left',
    padding: section.padding || 'medium',
    background: section.background || 'none',
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? "Add New Section" : "Configure Section"}</DialogTitle>
          <DialogDescription>
            Customize how this section appears in your invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isNew && (
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Enter section name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Width</Label>
            <Select
              value={config.width}
              onValueChange={(value: 'full' | 'half') => 
                setConfig({ ...config, width: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="half">Half Width</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Alignment</Label>
            <Select
              value={config.alignment}
              onValueChange={(value: 'left' | 'center' | 'right') => 
                setConfig({ ...config, alignment: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Padding</Label>
            <Select
              value={config.padding}
              onValueChange={(value: 'none' | 'small' | 'medium' | 'large') => 
                setConfig({ ...config, padding: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <Select
              value={config.background}
              onValueChange={(value: 'none' | 'muted' | 'primary' | 'card') => 
                setConfig({ ...config, background: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="muted">Muted</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            onUpdate(config)
            onOpenChange(false)
          }}>
            {isNew ? "Add Section" : "Update Section"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TemplateEditor({ open, onOpenChange, templateId }: TemplateEditorProps) {
  const { currentWorkspace } = useWorkspace()
  const { templates, addTemplate, updateTemplate } = useTemplate()
  const [name, setName] = useState("")
  const [sections, setSections] = useState<Template["sections"]>([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [itemColumns, setItemColumns] = useState<Template["itemColumns"]>([])
  const [activeTab, setActiveTab] = useState("layout")
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const form = useForm<InvoiceFormValues>({
    defaultValues: demoInvoiceData
  })
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [addingNewSection, setAddingNewSection] = useState<string | null>(null)
  const [useDemoData, setUseDemoData] = useState(false)

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  // Add field to a section
  const addFieldToSection = (sectionId: string) => {
    const newField: CustomField = {
      id: crypto.randomUUID(),
      label: "",
      type: "text",
      section: sectionId as CustomField['section'],
      placeholder: "",
      required: false,
    }
    setCustomFields(prev => [...prev, newField])
  }

  // Add custom field
  const addCustomField = () => {
    const newField: CustomField = {
      id: crypto.randomUUID(),
      label: "",
      type: "text",
      section: "custom",
      placeholder: "",
      required: false,
    }
    setCustomFields(prev => [...prev, newField])
  }

  // Load template data if editing
  useEffect(() => {
    if (templateId) {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        setName(template.name)
        setSections([...template.sections])
        setCustomFields([...template.customFields])
        setItemColumns([...template.itemColumns])
      }
    } else {
      // Reset form for new template
      setName("")
      setSections([
        { id: "logo", name: "Logo", show: true, order: 0 },
        { id: "title", name: "Invoice Title", show: true, order: 1 },
        { id: "business", name: "Business Details", show: true, order: 2 },
        { id: "customer", name: "Customer Details", show: true, order: 3 },
        { id: "dates", name: "Dates & Numbers", show: true, order: 4 },
        { id: "items", name: "Items", show: true, order: 5 },
        { id: "totals", name: "Totals", show: true, order: 6 },
        { id: "notes", name: "Notes", show: true, order: 7 },
        { id: "terms", name: "Terms", show: true, order: 8 },
      ])
      setCustomFields([])
      setItemColumns([
        { id: "description", label: "Description", type: "text", required: true, show: true },
        { id: "quantity", label: "Quantity", type: "number", required: true, show: true },
        { id: "rate", label: "Rate", type: "number", required: true, show: true },
        { id: "amount", label: "Amount", type: "number", required: true, show: true },
      ])
    }
  }, [templateId, templates])

  // Update form values for preview
  useEffect(() => {
    // Update form values based on template settings
    form.reset({
      ...form.getValues(),
      // Add any template-specific values here
    })
  }, [sections, customFields, itemColumns])

  // Update form with demo data when toggled
  useEffect(() => {
    if (useDemoData) {
      form.reset(demoInvoiceData)
    } else {
      form.reset({
        logo: "",
        number: "",
        date: new Date(),
        dueDate: new Date(),
        from: { name: "", email: "", address: "", phone: "", taxNumber: "", postalCode: "" },
        to: { businessName: "", address: "", optional: "" },
        items: [{ description: "", quantity: 0, rate: 0 }],
        tax: 0,
        shipping: 0,
        discount: 0,
        amountPaid: 0,
        notes: "",
        terms: "",
      })
    }
  }, [useDemoData])

  const handleSubmit = () => {
    if (!currentWorkspace) return

    const templateData = {
      name,
      sections,
      customFields,
      itemColumns,
      workspaceId: currentWorkspace.id,
    }

    if (templateId) {
      updateTemplate(templateId, templateData)
      toast({
        title: "Template updated",
        description: "Your invoice template has been updated.",
      })
    } else {
      addTemplate(templateData)
      toast({
        title: "Template created",
        description: "Your new invoice template has been created.",
      })
    }

    onOpenChange(false)
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(sections)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }))

    setSections(updatedItems)
  }

  const handleAddNewSection = (category: string) => {
    const newSectionId = crypto.randomUUID()
    const newSection: SectionConfig = {
      id: newSectionId,
      name: "",
      show: true,
      order: sections.length,
      width: 'full',
      alignment: 'left',
      padding: 'medium',
      background: 'none',
    }

    // Don't modify sectionCategories directly, instead track custom sections separately
    setSections(prev => [...prev, {
      id: newSectionId,
      name: newSection.name,
      show: newSection.show,
      order: newSection.order,
    }])

    setAddingNewSection(category)
    setConfiguring(newSectionId)
  }

  // Add function to check if a section is built-in
  const isBuiltInSection = (sectionId: string): boolean => {
    return sectionId in builtInSections
  }

  // Add function to handle section removal
  const handleRemoveSection = (sectionId: string) => {
    // Only remove if it's not a built-in section
    if (isBuiltInSection(sectionId)) {
      const section = builtInSections[sectionId as keyof typeof builtInSections]
      if (!section.removable) {
        toast({
          title: "Cannot remove section",
          description: "This is a required section and cannot be removed.",
          variant: "destructive"
        })
        return
      }
    }
    
    setSections(prev => prev.filter(s => s.id !== sectionId))
    setCustomFields(prev => prev.filter(f => f.section !== sectionId))
    toast({
      title: "Section removed",
      description: "The section has been removed from the template.",
    })
  }

  // Update section configuration dialog handler
  const handleSectionUpdate = (updatedConfig: SectionConfig) => {
    if (addingNewSection) {
      // For new sections, just update the sections state
      setSections(prev => prev.map(s => 
        s.id === updatedConfig.id 
          ? { ...s, name: updatedConfig.name, show: updatedConfig.show }
          : s
      ))
    } else {
      // For existing sections, update the configuration
      setSections(prev => prev.map(s => 
        s.id === updatedConfig.id 
          ? { ...s, ...updatedConfig }
          : s
      ))
    }
    
    setConfiguring(null)
    setAddingNewSection(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>
            {templateId ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            Customize your invoice template layout and fields
          </DialogDescription>
        </DialogHeader>

        <DemoDataToggle onToggle={setUseDemoData} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-[800px]">
          <div className="w-[400px] border-r flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b h-12 p-0">
              <TabsTrigger 
                value="layout" 
                className="flex-1 rounded-none border-r h-full data-[state=active]:bg-muted"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Template Settings
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="flex-1 rounded-none h-full data-[state=active]:bg-muted"
              >
                <Eye className="h-4 w-4 mr-2" />
                Form Preview
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  <div>
                    <Label>Template Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Standard Invoice"
                      className="mt-2"
                    />
                  </div>

                  {/* Sections grouped by category */}
                  {Object.entries(sectionCategories).map(([categoryKey, category]) => (
                    <Card key={categoryKey} className="p-4">
                      <div className="mb-4">
                        <h3 className="font-medium">{category.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {sections
                          .filter(section => category.sections.includes(section.id))
                          .map((section) => (
                            <div key={section.id} className="space-y-3">
                              <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 flex-1">
                                  <button
                                    className="flex items-center gap-2 flex-1"
                                    onClick={() => toggleSection(section.id)}
                                  >
                                    {expandedSections.includes(section.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                    <div>
                                      <span className="font-medium">{section.name}</span>
                                      {isBuiltInSection(section.id) && (
                                        <p className="text-xs text-muted-foreground">
                                          {builtInSections[section.id as keyof typeof builtInSections].description}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                  
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={section.show}
                                      onCheckedChange={(checked) => {
                                        const updatedSections = sections.map(s =>
                                          s.id === section.id ? { ...s, show: checked } : s
                                        )
                                        setSections(updatedSections)
                                      }}
                                    />
                                    {(isBuiltInSection(section.id) 
                                      ? builtInSections[section.id as keyof typeof builtInSections].removable 
                                      : true
                                    ) && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleRemoveSection(section.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {expandedSections.includes(section.id) && (
                                <div className="ml-6 space-y-3 border-l pl-4">
                                  {/* Default fields */}
                                  {defaultSectionFields[section.id as keyof typeof defaultSectionFields]?.map((field) => (
                                    <div key={field.id} className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={field.label}
                                          onChange={(e) => {
                                            // Update field label
                                          }}
                                          className="flex-1"
                                        />
                                        <Select
                                          value={field.type}
                                          onValueChange={(value) => {
                                            // Update field type
                                          }}
                                        >
                                          <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {fieldTypes.map(type => (
                                              <SelectItem 
                                                key={type.value} 
                                                value={type.value}
                                              >
                                                {type.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {fieldTypes.find(t => t.value === field.type)?.description}
                                      </p>
                                    </div>
                                  ))}

                                  {/* Custom fields for this section */}
                                  {customFields
                                    .filter(field => field.section === section.id)
                                    .map((field) => (
                                      <div key={field.id} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Input
                                            placeholder="Field Label"
                                            value={field.label}
                                            onChange={(e) => {
                                              const updated = [...customFields]
                                              const fieldIndex = customFields.findIndex(f => f.id === field.id)
                                              updated[fieldIndex] = { ...field, label: e.target.value }
                                              setCustomFields(updated)
                                            }}
                                            className="flex-1"
                                          />
                                          <Select
                                            value={field.type}
                                            onValueChange={(value) => {
                                              const updated = [...customFields]
                                              const fieldIndex = customFields.findIndex(f => f.id === field.id)
                                              updated[fieldIndex] = { ...field, type: value as any }
                                              setCustomFields(updated)
                                            }}
                                          >
                                            <SelectTrigger className="w-[120px]">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {fieldTypes.map(type => (
                                                <SelectItem 
                                                  key={type.value} 
                                                  value={type.value}
                                                >
                                                  {type.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              setCustomFields(prev => prev.filter(f => f.id !== field.id))
                                            }}
                                            className="hover:bg-destructive/10 hover:text-destructive"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {fieldTypes.find(t => t.value === field.type)?.description}
                                        </p>
                                      </div>
                                    ))}

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => addFieldToSection(section.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Field
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}

                        {category.allowNewSections && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleAddNewSection(categoryKey)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex-1">
            <TabsContent value="layout" className="m-0 p-6 h-full overflow-y-auto">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Section Order</h3>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="sections">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {sections
                            .filter(section => section.show)
                            .sort((a, b) => a.order - b.order)
                            .map((section, index) => (
                              <Draggable
                                key={section.id}
                                draggableId={section.id}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                                  >
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span>{section.name}</span>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="m-0 border-l h-full overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <FormPreview 
                  sections={sections} 
                  customFields={customFields} 
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-4 border-t bg-muted/50">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setActiveTab("preview")}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Form
              </Button>
              <Button onClick={handleSubmit}>
                {templateId ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </div>
        </div>

        {configuring && (
          <SectionConfigDialog
            open={true}
            onOpenChange={() => {
              setConfiguring(null)
              setAddingNewSection(null)
            }}
            section={addingNewSection ? {
              id: configuring,
              name: "",
              show: true,
              order: sections.length,
            } : sections.find(s => s.id === configuring) || {}}
            onUpdate={handleSectionUpdate}
            isNew={addingNewSection !== null}
          />
        )}
      </DialogContent>
    </Dialog>
  )
} 