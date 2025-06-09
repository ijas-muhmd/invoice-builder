"use client"

import { useEffect, useState, useRef } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { type InvoiceFormValues } from '@/app/invoice-schema';
import { useInvoices } from '@/contexts/invoice-context';
import { isEqual } from 'lodash';

export function useAutosave(form: UseFormReturn<InvoiceFormValues>, invoiceId?: string) {
  const { saveDraft, getInvoice, updateInvoice } = useInvoices();
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousValueRef = useRef<InvoiceFormValues | null>(null);

  // Initial load
  useEffect(() => {
    if (invoiceId) {
      // If editing an existing invoice, load that invoice
      const invoice = getInvoice(invoiceId);
      if (invoice) {
        const formattedInvoice = {
          ...invoice,
          date: new Date(invoice.date),
          dueDate: new Date(invoice.dueDate),
        };
        form.reset(formattedInvoice);
        previousValueRef.current = formattedInvoice;
      }
    } else {
      // If creating new invoice, load draft if exists
      const savedData = localStorage.getItem('invoice-draft');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Convert string dates back to Date objects
        const formattedData = {
          ...parsedData,
          date: new Date(parsedData.date),
          dueDate: new Date(parsedData.dueDate),
        };
        form.reset(formattedData);
        previousValueRef.current = formattedData;
      }
    }
  }, [form, invoiceId, getInvoice]);

  // Set up autosave subscription
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!value) return;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Check if the value has actually changed
      const currentValue = form.getValues();
      if (isEqual(currentValue, previousValueRef.current)) {
        return;
      }

      setSaving(true);

      // Debounce the save operation
      timeoutRef.current = setTimeout(() => {
        if (invoiceId) {
          // If editing, update the invoice
          const savedBankDetails = localStorage.getItem('current_bank_details');
          const bankDetails = savedBankDetails ? JSON.parse(savedBankDetails) : null;
          const activeFields = localStorage.getItem('active_custom_fields') 
            ? JSON.parse(localStorage.getItem('active_custom_fields')!) 
            : [];

          updateInvoice(invoiceId, {
            ...value as InvoiceFormValues,
            date: value.date?.toISOString() || new Date().toISOString(),
            dueDate: value.dueDate?.toISOString() || new Date().toISOString(),
            selectedBankAccountId: bankDetails?.selectedAccountId,
            activeFields,
            // Preserve all custom fields
            gst: value.gst ?? '',
            taxId: value.taxId ?? '',
            vatNumber: value.vatNumber ?? '',
            customerId: value.customerId ?? '',
            referenceNumber: value.referenceNumber ?? '',
            projectCode: value.projectCode ?? '',
            bankDetails: value.bankDetails ?? '',
            termsAndConditions: value.termsAndConditions ?? '',
          });
        } else {
          // If new, save as draft
          saveDraft(value as InvoiceFormValues);
        }
        previousValueRef.current = currentValue;
        setSaving(false);
      }, 300); // Reduced debounce time to 300ms for better responsiveness
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [form, invoiceId, saveDraft, updateInvoice]);

  return { saving };
} 