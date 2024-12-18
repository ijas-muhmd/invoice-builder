'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/contexts/invoice-context';
import { useForm } from 'react-hook-form';
import { type InvoiceFormValues } from '@/app/invoice-schema';
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { invoiceSchema } from '@/app/invoice-schema';
import { useFieldArray } from "react-hook-form";
import { PreviewModal } from "@/components/preview-modal";
import { Download } from "lucide-react";
import { generatePDF } from "@/lib/generate-pdf";
import { LogoUpload } from "@/components/logo-upload";
import { CurrencySelect } from "@/components/currency-select";
import { InvoiceItems } from "@/components/invoice-items";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/date-picker";
import { CustomerSelect } from "@/components/customer-select";
import Link from "next/link";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveIndicator } from "@/components/autosave-indicator";
import { BusinessDetailsButton } from "@/components/business-details-button";
import { CustomizeFieldsModal } from "@/components/customize-fields-modal";
import { BankAccountSelectField } from "@/components/bank-account-select-field";
import { Preview } from "@/components/preview"

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const { invoices, updateInvoice } = useInvoices();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeFields, setActiveFields] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  // Find the invoice
  const invoice = invoices.find(inv => inv.id === params.id);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice ? {
      ...invoice,
      date: new Date(invoice.date),
      dueDate: new Date(invoice.dueDate),
      bankDetails: invoice.bankDetails || "",
      gst: invoice.gst || "",
      taxId: invoice.taxId || "",
      vatNumber: invoice.vatNumber || "",
      customerId: invoice.customerId || "",
      referenceNumber: invoice.referenceNumber || "",
      projectCode: invoice.projectCode || "",
      termsAndConditions: invoice.termsAndConditions || "",
      from: {
        name: invoice.from?.name ?? "",
        email: invoice.from?.email ?? "",
        address: invoice.from?.address ?? "",
        phone: invoice.from?.phone ?? "",
        taxNumber: invoice.from?.taxNumber ?? "",
        postalCode: invoice.from?.postalCode ?? "",
      },
      to: {
        businessName: invoice.to?.businessName ?? "",
        address: invoice.to?.address ?? "",
        optional: invoice.to?.optional ?? "",
      },
      itemLabels: {
        description: invoice.itemLabels?.description ?? "DESCRIPTION",
        quantity: invoice.itemLabels?.quantity ?? "QTY",
        price: invoice.itemLabels?.price ?? "PRICE",
        amount: invoice.itemLabels?.amount ?? "AMOUNT"
      },
      items: invoice.items ?? [],
      notes: invoice.notes ?? "",
    } : {
      bankDetails: "",
      gst: "",
      taxId: "",
      vatNumber: "",
      customerId: "",
      referenceNumber: "",
      projectCode: "",
      termsAndConditions: "",
    }
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const { saving } = useAutosave(form, params.id);

  useEffect(() => {
    setMounted(true);
    if (!invoice) {
      router.push('/invoices');
    }
  }, [invoice, router]);

  // Update the initialization of activeFields
  useEffect(() => {
    if (invoice) {
     
      if (Array.isArray(invoice.activeFields) && invoice.activeFields.length > 0) {
          setActiveFields(invoice.activeFields);
          
        }
      // Load active fields from localStorage specific to the current invoice
      // const savedFields = localStorage.getItem(`active_custom_fields_${params.id}`);
      // if (savedFields) {
      //   const parsedFields = JSON.parse(savedFields);
      //   setActiveFields(parsedFields);
      // } else if (Array.isArray(invoice.activeFields) && invoice.activeFields.length > 0) {
      //   setActiveFields(invoice.activeFields);
      //   localStorage.setItem(`active_custom_fields_${params.id}`, JSON.stringify(invoice.activeFields));
      // }
    }
  }, [invoice, params.id]);

  // Update the handleToggleField function
  const handleToggleField = (fieldId: string, enabled: boolean) => {
    const newActiveFields = enabled 
      ? [...activeFields, fieldId]
      : activeFields.filter(f => f !== fieldId);
    
    const currentValues = form.getValues();
    
    // Ensure we preserve the current values even when fields are toggled
    const updateData = {
      ...invoice,
      ...currentValues,
      activeFields: newActiveFields,
      // Always include these fields with their current values or empty strings
      gst: currentValues.gst || "",
      taxId: currentValues.taxId || "",
      vatNumber: currentValues.vatNumber || "",
      customerId: currentValues.customerId || "",
      referenceNumber: currentValues.referenceNumber || "",
      projectCode: currentValues.projectCode || "",
      bankDetails: currentValues.bankDetails || "",
      termsAndConditions: currentValues.termsAndConditions || "",
    };

    // Update the invoice in the context
    updateInvoice(params.id, updateData);

    // Update localStorage for the current invoice's active fields
    localStorage.setItem(`active_custom_fields_${params.id}`, JSON.stringify(newActiveFields));
    setActiveFields(newActiveFields);
    
    // Reset form with updated values
    form.reset(updateData, {
      keepDefaultValues: true,
      keepDirty: true,
      keepValues: true,
    });
  };

  // Update the autosave effect
  useEffect(() => {
    if (!form || !params.id) return;

    const subscription = form.watch((value) => {
      if (!value || !form.formState.isDirty) return;

      const savedBankDetails = localStorage.getItem('current_bank_details');
      const bankDetails = savedBankDetails ? JSON.parse(savedBankDetails) : null;

      const updateData = {
        ...invoice,
        ...value,
        date: new Date(value.date?.toISOString() || new Date().toISOString()),
        dueDate: new Date(value.dueDate?.toISOString() || new Date().toISOString()),
        selectedBankAccountId: bankDetails?.selectedAccountId,
        activeFields, // Include current activeFields
        // Preserve all custom fields
        gst: value.gst ?? invoice?.gst ?? '',
        taxId: value.taxId ?? invoice?.taxId ?? '',
        vatNumber: value.vatNumber ?? invoice?.vatNumber ?? '',
        customerId: value.customerId ?? invoice?.customerId ?? '',
        referenceNumber: value.referenceNumber ?? invoice?.referenceNumber ?? '',
        projectCode: value.projectCode ?? invoice?.projectCode ?? '',
        bankDetails: value.bankDetails ?? invoice?.bankDetails ?? '',
        termsAndConditions: value.termsAndConditions ?? invoice?.termsAndConditions ?? '',
      } as InvoiceFormValues

      const timeoutId = setTimeout(() => {
        updateInvoice(params.id, updateData);
      }, 500);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [form, params.id, updateInvoice, invoice, activeFields]);

  if (!mounted || !invoice) return null;

  const onSubmit = (data: InvoiceFormValues) => {
    // Get the current bank details from localStorage
    const savedBankDetails = localStorage.getItem('current_bank_details');
    const bankDetails = savedBankDetails ? JSON.parse(savedBankDetails) : null;

    // Create update object preserving all fields
    const updateData = {
      ...invoice, // Preserve existing data
      ...data,    // Override with new values
      date: data.date.toISOString(),
      dueDate: data.dueDate.toISOString(),
      selectedBankAccountId: bankDetails?.selectedAccountId,
      // Preserve custom fields even if empty
      gst: data.gst ?? invoice?.gst ?? '',
      taxId: data.taxId ?? invoice?.taxId ?? '',
      vatNumber: data.vatNumber ?? invoice?.vatNumber ?? '',
      customerId: data.customerId ?? invoice?.customerId ?? '',
      referenceNumber: data.referenceNumber ?? invoice?.referenceNumber ?? '',
      projectCode: data.projectCode ?? invoice?.projectCode ?? '',
      bankDetails: data.bankDetails ?? invoice?.bankDetails ?? '',
      termsAndConditions: data.termsAndConditions ?? invoice?.termsAndConditions ?? '',
      activeFields: activeFields, // Always include active fields
    };

    updateInvoice(params.id, updateData);

    toast({
      title: "Invoice updated",
      description: "Your invoice has been updated successfully.",
    });
    router.push('/invoices');
  };

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

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-[850px] mx-auto">
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-4xl mb-2">Edit Invoice</h1>
            <p className="text-muted-foreground">
              Edit invoice #{invoice.number}
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
              <Button 
                variant="outline"
                onClick={() => router.push('/invoices')}
                className="button-airbnb"
              >
                Cancel
              </Button>
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
                  <FormField
                    control={form.control}
                    name="from.taxNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Tax registration number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="from.postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Postal code" {...field} />
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
                        <BankAccountSelectField 
                          form={form} 
                          key={field.value} // Add key to force re-render on value change
                        />
                        <Textarea
                          placeholder="Enter bank account details..."
                          className="resize-none"
                          rows={4}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // Manually trigger form update
                            form.setValue('bankDetails', e.target.value, { 
                              shouldDirty: true,
                              shouldTouch: true 
                            });
                          }}
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
                onClick={handleExportPDF}
                className="button-airbnb"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/invoices')}
                className="button-airbnb"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="button-airbnb bg-primary hover:bg-primary/90"
              >
                Update Invoice
              </Button>
            </div>
          </form>
        </Form>
        <AutosaveIndicator saving={saving} />
      </div>

      {/* Hidden preview for PDF generation */}
      <div className="hidden">
        <div ref={previewRef}>
          <Preview form={form} />
        </div>
      </div>
    </div>
  );
} 
