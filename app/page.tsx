'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { InvoiceItems } from "@/components/invoice-items";
import { invoiceSchema, type InvoiceFormValues } from "./invoice-schema";
import Link from "next/link";
import { Preview } from "@/components/preview";
import { generatePDF } from "@/lib/generate-pdf";
import { format } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAutosave } from "@/hooks/use-autosave"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { PreviewModal } from "@/components/preview-modal"
import { LogoUpload } from "@/components/logo-upload"
import { CurrencySelect } from "@/components/currency-select"
import { useBusinessDetails } from "@/contexts/business-details-context"
import { useEffect, useState, useRef } from "react"
import { useInvoices } from "@/contexts/invoice-context";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/date-picker"
import { CustomerSelect } from "@/components/customer-select"
import { AutosaveIndicator } from "@/components/autosave-indicator"
import { BusinessDetailsButton } from "@/components/business-details-button"
import { CustomizeFieldsModal } from "@/components/customize-fields-modal";
import { BankAccountSelectField } from "@/components/bank-account-select-field";

export default function Home() {
  const { businessDetails } = useBusinessDetails()
  const {invoices, addInvoice, getDraft, clearDraft, saveDraft } = useInvoices()
  const router = useRouter()

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      logo: "",
      number: "INV-0001",
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: "",
      poNumber: "",
      currency: "EUR",
      from: {
        name: businessDetails.name,
        email: businessDetails.email,
        address: businessDetails.address,
        phone: businessDetails.phone,
        taxNumber: businessDetails.taxNumber,
        postalCode: businessDetails.postalCode,
      },
      to: {
        businessName: "",
        address: "",
        optional: "",
      },
      items: [{ description: "", quantity: 0, rate: 0 }],
      tax: 0,
      shipping: 0,
      discount: 0,
      amountPaid: 0,
      notes: "",
      terms: "",
      gst: "",
      taxId: "",
      vatNumber: "",
      customerId: "",
      referenceNumber: "",
      projectCode: "",
      bankDetails: "",
      termsAndConditions: "",
      itemLabels: {
        description: "DESCRIPTION",
        quantity: "QTY",
        price: "PRICE",
        amount: "AMOUNT"
      },
    },
  });

  // In the page component, just load the draft if it exists
  useEffect(() => {
    const draft = getDraft();
    if (draft) {
      form.reset(draft);
      // Set activeFields based on which fields have values
      const fieldsToActivate = [];
      if (draft.gst) fieldsToActivate.push('gst');
      if (draft.taxId) fieldsToActivate.push('taxId');
      if (draft.vatNumber) fieldsToActivate.push('vatNumber');
      if (draft.customerId) fieldsToActivate.push('customerId');
      if (draft.referenceNumber) fieldsToActivate.push('referenceNumber');
      if (draft.projectCode) fieldsToActivate.push('projectCode');
      setActiveFields(fieldsToActivate);
    }
  }, [form, getDraft]);

  // Enable autosave
  const { saving } = useAutosave(form);

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  function onSubmit(data: InvoiceFormValues) {
    addInvoice(data, 'pending')
    clearDraft()
    const defaultValues = {
      logo: "",
      number: "INV-0001",
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: "",
      poNumber: "",
      currency: "EUR",
      from: {
        name: businessDetails.name,
        email: businessDetails.email,
        address: businessDetails.address,
        phone: businessDetails.phone,
        taxNumber: businessDetails.taxNumber,
        postalCode: businessDetails.postalCode,
      },
      to: {
        businessName: "",
        address: "",
        optional: "",
      },
      items: [{ description: "", quantity: 0, rate: 0 }],
      tax: 0,
      shipping: 0,
      discount: 0,
      amountPaid: 0,
      notes: "",
      terms: "",
      gst: "",
      taxId: "",
      vatNumber: "",
      customerId: "",
      referenceNumber: "",
      projectCode: "",
      bankDetails: "",
      termsAndConditions: "",
      itemLabels: {
        description: "DESCRIPTION",
        quantity: "QTY",
        price: "PRICE",
        amount: "AMOUNT"
      },
    };
    form.reset(defaultValues);
    toast({
      title: "Invoice created",
      description: "Your invoice has been created successfully.",
    })
    router.push('/invoices')
  }

  const previewRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (previewRef.current) {
      try {
        const doc = await generatePDF(previewRef.current);
        doc.save(`invoice-${form.getValues().number}.pdf`);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to generate PDF",
          variant: "destructive"
        });
      }
    }
  };

  const getNextInvoiceNumber = () => {
    console.log(`invoice length.......${invoices.length}`);
    if (invoices.length === 0) return "INV-0002";
    
    const numbers = invoices.map(inv => {
      const match = inv.number.match(/INV-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    const maxNumber = Math.max(...numbers);
    return `INV-${String(maxNumber + 2).padStart(4, '0')}`;
    // return "INV-0004";
  };

  const handleClearDraft = () => {
    clearDraft()
    const defaultValues = {
      logo: "",
      number: "INV-0001",
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: "",
      poNumber: "",
      currency: "EUR",
      from: {
        name: businessDetails.name,
        email: businessDetails.email,
        address: businessDetails.address,
        phone: businessDetails.phone,
        taxNumber: businessDetails.taxNumber,
        postalCode: businessDetails.postalCode,
      },
      to: {
        businessName: "",
        address: "",
        optional: "",
      },
      items: [{ description: "", quantity: 0, rate: 0 }],
      tax: 0,
      shipping: 0,
      discount: 0,
      amountPaid: 0,
      notes: "",
      terms: "",
      gst: "",
      taxId: "",
      vatNumber: "",
      customerId: "",
      referenceNumber: "",
      projectCode: "",
      bankDetails: "",
      termsAndConditions: "",
      itemLabels: {
        description: "DESCRIPTION",
        quantity: "QTY",
        price: "PRICE",
        amount: "AMOUNT"
      },
    };
    form.reset(defaultValues);
    toast({
      title: "Draft cleared",
      description: "Your draft has been cleared successfully.",
    });
  };

  // Add autosave for drafts
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value) {
        saveDraft(value as InvoiceFormValues);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, saveDraft]);

  const saveDraftAndNavigate = async () => {
    const currentData = form.getValues()
    await addInvoice(currentData, 'draft')
    clearDraft()
    
    // Create default values while preserving custom fields structure
    const defaultValues = {
      logo: "",
      number: getNextInvoiceNumber(),
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: "",
      poNumber: "",
      currency: "EUR",
      from: {
        name: businessDetails.name,
        email: businessDetails.email,
        address: businessDetails.address,
        phone: businessDetails.phone,
        taxNumber: businessDetails.taxNumber,
        postalCode: businessDetails.postalCode,
      },
      to: {
        businessName: "",
        address: "",
        optional: "",
      },
      items: [{ description: "", quantity: 0, rate: 0 }],
      tax: 0,
      shipping: 0,
      discount: 0,
      amountPaid: 0,
      notes: "",
      terms: "",
      itemLabels: {
        description: "DESCRIPTION",
        quantity: "QTY",
        price: "PRICE",
        amount: "AMOUNT"
      },
      // Initialize all possible custom fields
      gst: activeFields.includes('gst') ? "" : undefined,
      taxId: activeFields.includes('taxId') ? "" : undefined,
      vatNumber: activeFields.includes('vatNumber') ? "" : undefined,
      customerId: activeFields.includes('customerId') ? "" : undefined,
      referenceNumber: activeFields.includes('referenceNumber') ? "" : undefined,
      projectCode: activeFields.includes('projectCode') ? "" : undefined,
      bankDetails: activeFields.includes('bankDetails') ? "" : undefined,
      termsAndConditions: activeFields.includes('termsAndConditions') ? "" : undefined,
    };

    form.reset(defaultValues);
    router.push('/invoices')
  }

  const [activeFields, setActiveFields] = useState<string[]>([]);

  // Add this to track active fields in localStorage
  useEffect(() => {
    const savedFields = localStorage.getItem('active_custom_fields');
    if (savedFields) {
      const fields = JSON.parse(savedFields);
      setActiveFields(fields);
    }
  }, []);

  // Update the handleToggleField function
  const handleToggleField = (fieldId: string, enabled: boolean) => {
    // Create the new fields array first
    const newFields = enabled 
      ? [...activeFields, fieldId]
      : activeFields.filter(f => f !== fieldId);
    
    // Save active fields to localStorage
    localStorage.setItem('active_custom_fields', JSON.stringify(newFields));
    
    // Get current form values
    const currentValues = form.getValues();
    
    // Create updated values with the new field
    const updatedValues = {
      ...currentValues,
      // If enabling, set empty string, if disabling, remove the field
      [fieldId]: enabled ? "" : undefined
    };
    
    // Update form with new values
    form.reset(updatedValues);
    
    // Save to draft immediately
    saveDraft(updatedValues);
    
    // Update state after all other operations
    setActiveFields(newFields);
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-[850px] mx-auto">
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-4xl mb-2">New Invoice</h1>
            <p className="text-muted-foreground">
              Create a professional invoice in minutes
            </p>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <CustomizeFieldsModal 
                onToggleField={handleToggleField}
                activeFields={activeFields}
              />
            </div>
            <div className="flex items-center gap-4">
              <PreviewModal form={form} />
              <Button 
                variant="outline" 
                onClick={handleExportPDF}
                className="button-airbnb"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Link href="/invoices">
                <Button 
                  variant="outline"
                  className="button-airbnb"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="form-section">
              <h2 className="text-xl font-semibold mb-6">Invoice Details</h2>
              <div className="space-y-6">
                <div className="w-full">
                  <LogoUpload />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Net 30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="poNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PO Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Purchase Order Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <CurrencySelect />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {activeFields.includes('gst') && (
                    <FormField
                      control={form.control}
                      name="gst"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter GST Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {activeFields.includes('taxId') && (
                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Tax ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {activeFields.includes('vatNumber') && (
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter VAT Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {activeFields.includes('customerId') && (
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Customer ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {activeFields.includes('referenceNumber') && (
                    <FormField
                      control={form.control}
                      name="referenceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Reference Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {activeFields.includes('projectCode') && (
                    <FormField
                      control={form.control}
                      name="projectCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Project Code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card className="form-section">
                <h2 className="text-lg font-semibold mb-6">Business Details</h2>
                <div className="space-y-4">
                  <BusinessDetailsButton form={form} />
                  <FormField
                    control={form.control}
                    name="from.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="from.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="from.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Business address"
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="from.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              <Card className="form-section">
                <h2 className="text-lg font-semibold mb-6">Customer Details</h2>
                <div className="space-y-4">
                  <CustomerSelect
                    value={form.watch('to.businessName')}
                    onSelect={(customer) => {
                      form.setValue('to', {
                        businessName: customer.businessName,
                        address: customer.address,
                        optional: customer.notes || '',
                      }, { shouldDirty: true });
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="to.businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Customer business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="to.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Customer address"
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="to.optional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional shipping or billing information..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </div>

            <InvoiceItems
              form={form}
              items={fields}
              onAddItem={() => append({ description: "", quantity: 0, rate: 0 })}
              onRemoveItem={remove}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or terms..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {activeFields.includes('bankDetails') && (
              <FormField
                control={form.control}
                name="bankDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account Details</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <BankAccountSelectField form={form} />
                        <Textarea
                          placeholder="Enter bank account details..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {activeFields.includes('termsAndConditions') && (
              <FormField
                control={form.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter terms and conditions..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end items-center gap-4">
              <PreviewModal form={form} />
              <Button 
                variant="outline" 
                type="button"
                className="button-airbnb"
                onClick={saveDraftAndNavigate}
              >
                Save as Draft
              </Button>
              <Button 
                type="submit"
                className="button-airbnb bg-primary hover:bg-primary/90"
              >
                Create Invoice
              </Button>
            </div>
          </form>
        </Form>
        <AutosaveIndicator saving={saving} />

        <div className="hidden">
          <div ref={previewRef}>
            <Preview form={form} />
          </div>
        </div>
      </div>
    </div>
  );
}
