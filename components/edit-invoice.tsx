'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/contexts/invoice-context';
import { useForm, useFieldArray } from 'react-hook-form';
import { type InvoiceFormValues } from '@/app/invoice-schema';
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { invoiceSchema } from '@/app/invoice-schema';
import { CustomizeFieldsModal } from '@/components/customize-fields-modal';
import { LogoUpload } from "@/components/logo-upload"
import { DatePicker } from "@/components/date-picker"
import { CurrencySelect } from "@/components/currency-select"
import { Download } from "lucide-react"
import { PreviewModal } from "@/components/preview-modal"
import { generatePDF } from "@/lib/generate-pdf"
import { Textarea } from "@/components/ui/textarea"
import { InvoiceItems } from "@/components/invoice-items"
import { BusinessDetailsButton } from "@/components/business-details-button"
import { CustomerSelect } from "@/components/customer-select"

interface EditInvoiceProps {
  params: {
    id: string;
  };
}

export function EditInvoice({ params }: EditInvoiceProps) {
  const { invoices, updateInvoice } = useInvoices();
  const router = useRouter();
  const [activeFields, setActiveFields] = useState<string[]>([]);

  // Find the invoice
  const invoice = invoices.find(inv => inv.id === params.id);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice ? {
      ...invoice,
      date: new Date(invoice.date),
      dueDate: new Date(invoice.dueDate),
    } : undefined,
  });

  // Initialize activeFields based on existing data
  useEffect(() => {
    if (invoice) {
      const fieldsToActivate = [];
      if (invoice.gst) fieldsToActivate.push('gst');
      if (invoice.taxId) fieldsToActivate.push('taxId');
      if (invoice.vatNumber) fieldsToActivate.push('vatNumber');
      if (invoice.customerId) fieldsToActivate.push('customerId');
      if (invoice.referenceNumber) fieldsToActivate.push('referenceNumber');
      if (invoice.projectCode) fieldsToActivate.push('projectCode');
      setActiveFields(fieldsToActivate);
    }
  }, [invoice]);

  const handleToggleField = (fieldId: string, enabled: boolean) => {
    setActiveFields(prev => 
      enabled 
        ? [...prev, fieldId]
        : prev.filter(f => f !== fieldId)
    );
  };

  // If invoice not found, redirect to invoices page
  useEffect(() => {
    if (!invoice) {
      router.push('/invoices');
    }
  }, [invoice, router]);

  if (!invoice) return null;

  const onSubmit = (data: InvoiceFormValues) => {
    updateInvoice(params.id, {
      ...data,
      date: data.date.toISOString(),
      dueDate: data.dueDate.toISOString(),
    });
    toast({
      title: "Invoice updated",
      description: "Your invoice has been updated successfully.",
    });
    router.push('/invoices');
  };

  // Add useFieldArray hook
  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  return (
    <div className="container mx-auto p-8 bg-red-100">
      <div className="max-w-[850px] mx-auto">
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-4xl mb-2">Edit Invoice</h1>
            <p className="text-muted-foreground">
              Edit invoice #{invoice.number}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <CustomizeFieldsModal 
              onToggleField={handleToggleField}
              activeFields={activeFields}
            />
            <PreviewModal form={form} />
            <Button 
              variant="outline" 
              onClick={async () => {
                const previewRef = document.getElementById('preview-ref') as HTMLDivElement | null;
                if (previewRef) {
                  const doc = await generatePDF(previewRef);
                  doc.save(`invoice-${form.getValues().number}.pdf`);
                }
                // const doc = await generatePDF(form.getValues());
                // doc.save(`invoice-${form.getValues().number}.pdf`);
              }}
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
                  
                  {/* Custom Fields */}
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

            <div className="flex justify-end items-center gap-4">
              <PreviewModal form={form} />
              <Button 
                type="submit"
                className="button-airbnb bg-primary hover:bg-primary/90"
              >
                Update Invoice
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 
