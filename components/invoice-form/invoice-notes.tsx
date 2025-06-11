"use client"

import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { type UseFormReturn } from "react-hook-form"
import { type InvoiceFormValues } from "@/app/invoice-schema"
import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface InvoiceNotesProps {
  form: UseFormReturn<InvoiceFormValues>
}

export function InvoiceNotes({ form }: InvoiceNotesProps) {
  // Signature state
  const [typedSignature, setTypedSignature] = useState<string>(form.watch('typedSignature') ?? '');
  const [uploadedSignature, setUploadedSignature] = useState<string>(form.watch('uploadedSignature') ?? '');

  useEffect(() => {
    form.setValue('typedSignature', typedSignature, { shouldDirty: true });
  }, [typedSignature]);
  useEffect(() => {
    form.setValue('uploadedSignature', uploadedSignature, { shouldDirty: true });
  }, [uploadedSignature]);

  // Upload logic
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedSignature(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or bank details..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms and Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Payment terms, delivery schedule..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Signature Section */}
        <div className="mt-8 w-full">
          <FormLabel>Signature</FormLabel>
          <div className="w-full mb-4">
            <input
              type="text"
              className="border rounded px-2 py-1 w-full"
              placeholder="Type your name"
              value={typedSignature}
              onChange={e => setTypedSignature(e.target.value)}
            />
            {typedSignature && (
              <div className="mt-2 italic text-lg font-signature">{typedSignature}</div>
            )}
          </div>
          <div className="w-full">
            <div className="flex flex-col gap-2">
              <label htmlFor="signature-upload" className="inline-block cursor-pointer">
                <span className="block text-sm font-medium text-muted-foreground mb-1">Upload a scanned signature image (PNG, JPG, etc.)</span>
                <div className="inline-block">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {uploadedSignature ? 'Change File' : 'Choose File'}
                  </button>
                </div>
              </label>
              <input
                id="signature-upload"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              {uploadedSignature && (
                <div className="mt-2 flex flex-col items-start gap-1">
                  <img src={uploadedSignature} alt="Signature preview" className="h-16 border rounded shadow" />
                  <span className="text-xs text-muted-foreground">Signature image preview</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}