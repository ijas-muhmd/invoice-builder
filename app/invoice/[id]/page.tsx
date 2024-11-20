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
      itemLabels: invoice.itemLabels || {
        description: "DESCRIPTION",
        quantity: "QTY",
        price: "PRICE",
        amount: "AMOUNT"
      },
    } : undefined,
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

  // Add this effect to load saved active fields
  useEffect(() => {
    const savedFields = localStorage.getItem('active_custom_fields');
    if (savedFields) {
      const fields = JSON.parse(savedFields);
      setActiveFields(fields);
    }
  }, []);

  const handleToggleField = (fieldId: string, enabled: boolean) => {
    setActiveFields(prev => {
      const newFields = enabled 
        ? [...prev, fieldId]
        : prev.filter(f => f !== fieldId);
      
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
      form.reset(updatedValues, { 
        keepValues: true,
        keepDirty: true,
        keepIsSubmitted: true,
        keepTouched: true,
        keepErrors: true,
        keepIsValid: true,
        keepSubmitCount: true
      });

      // Trigger immediate autosave with the new field
      updateInvoice(params.id, {
        ...updatedValues,
        date: updatedValues.date?.toISOString() || new Date().toISOString(),
        dueDate: updatedValues.dueDate?.toISOString() || new Date().toISOString(),
      }, newFields);
      
      return newFields;
    });
  };

  // Initialize activeFields based on existing data
  useEffect(() => {
    if (invoice) {
      // Use saved active fields if they exist
      if (invoice.activeFields) {
        setActiveFields(invoice.activeFields);
        // Save to localStorage to maintain state
        localStorage.setItem('active_custom_fields', JSON.stringify(invoice.activeFields));
        
        // If bank details exist, restore the selected bank account
        if (invoice.bankDetails && invoice.selectedBankAccountId) {
          localStorage.setItem('current_bank_details', JSON.stringify({
            content: invoice.bankDetails,
            selectedAccountId: invoice.selectedBankAccountId
          }));
        }
      } else {
        // Calculate active fields from data
        const fieldsToActivate = [];
        if (invoice.gst) fieldsToActivate.push('gst');
        if (invoice.taxId) fieldsToActivate.push('taxId');
        if (invoice.vatNumber) fieldsToActivate.push('vatNumber');
        if (invoice.customerId) fieldsToActivate.push('customerId');
        if (invoice.referenceNumber) fieldsToActivate.push('referenceNumber');
        if (invoice.projectCode) fieldsToActivate.push('projectCode');
        if (invoice.bankDetails) fieldsToActivate.push('bankDetails');
        if (invoice.termsAndConditions) fieldsToActivate.push('termsAndConditions');
        
        setActiveFields(fieldsToActivate);
        // Save to localStorage to maintain state
        localStorage.setItem('active_custom_fields', JSON.stringify(fieldsToActivate));
      }
    }
  }, [invoice]);

  // Update the autosave effect
  useEffect(() => {
    if (!form || !params.id) return;

    const subscription = form.watch((value) => {
      // Prevent unnecessary updates
      if (!value || !form.formState.isDirty) return;

      // Get the current bank details
      const savedBankDetails = localStorage.getItem('current_bank_details');
      const bankDetails = savedBankDetails ? JSON.parse(savedBankDetails) : null;

      // Get current active fields
      const savedFields = localStorage.getItem('active_custom_fields');
      const currentActiveFields = savedFields ? JSON.parse(savedFields) : activeFields;

      // Create a clean update object with only enabled fields
      const updateData = {
        ...value,
        date: value.date?.toISOString() || new Date().toISOString(),
        dueDate: value.dueDate?.toISOString() || new Date().toISOString(),
        // Only include fields that are active
        gst: currentActiveFields.includes('gst') ? value.gst : undefined,
        taxId: currentActiveFields.includes('taxId') ? value.taxId : undefined,
        vatNumber: currentActiveFields.includes('vatNumber') ? value.vatNumber : undefined,
        customerId: currentActiveFields.includes('customerId') ? value.customerId : undefined,
        referenceNumber: currentActiveFields.includes('referenceNumber') ? value.referenceNumber : undefined,
        projectCode: currentActiveFields.includes('projectCode') ? value.projectCode : undefined,
        bankDetails: currentActiveFields.includes('bankDetails') ? value.bankDetails : undefined,
        termsAndConditions: currentActiveFields.includes('termsAndConditions') ? value.termsAndConditions : undefined,
        selectedBankAccountId: bankDetails?.selectedAccountId,
      };

      // Debounce the update
      const timeoutId = setTimeout(() => {
        updateInvoice(params.id, updateData, currentActiveFields);
      }, 500);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [form, params.id, updateInvoice, activeFields]);

  if (!mounted || !invoice) return null;

  const onSubmit = (data: InvoiceFormValues) => {
    // Get the current bank details from localStorage
    const savedBankDetails = localStorage.getItem('current_bank_details');
    const bankDetails = savedBankDetails ? JSON.parse(savedBankDetails) : null;

    updateInvoice(params.id, {
      ...data,
      date: data.date.toISOString(),
      dueDate: data.dueDate.toISOString(),
      // Include selected bank account ID if exists
      selectedBankAccountId: bankDetails?.selectedAccountId
    }, activeFields);

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
