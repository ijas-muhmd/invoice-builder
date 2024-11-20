"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Eye, Printer, Download } from "lucide-react"
import { Preview } from "@/components/preview"
import { type UseFormReturn } from "react-hook-form"
import { type InvoiceFormValues } from "@/app/invoice-schema"
import { useRef } from "react"
import { generatePDF } from "@/lib/generate-pdf"
import { toast } from "react-hot-toast"

interface PreviewModalProps {
  form: UseFormReturn<InvoiceFormValues>
}

export function PreviewModal({ form }: PreviewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = previewRef.current?.innerHTML || ''
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Invoice</title>
            <link rel="stylesheet" href="/styles.css" />
            <style>
              @media print {
                body { 
                  padding: 20px;
                  background: white;
                }
                @page { 
                  size: A4;
                  margin: 1cm;
                }
                .grid { 
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 2rem;
                }
                .grid-cols-2 {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 2rem;
                }
                .space-y-0\\.5 > * + * {
                  margin-top: 0.125rem;
                }
                .space-y-2 > * + * {
                  margin-top: 0.5rem;
                }
                .space-y-4 > * + * {
                  margin-top: 1rem;
                }
                .space-y-6 > * + * {
                  margin-top: 1.5rem;
                }
                .mb-8 {
                  margin-bottom: 2rem;
                }
                .text-right {
                  text-align: right;
                }
                .text-gray-500 {
                  color: #6b7280;
                }
                .text-gray-600 {
                  color: #4b5563;
                }
                .text-gray-800 {
                  color: #1f2937;
                }
                .font-medium {
                  font-weight: 500;
                }
                .text-xs {
                  font-size: 0.75rem;
                }
                .text-sm {
                  font-size: 0.875rem;
                }
                .text-2xl {
                  font-size: 1.5rem;
                }
              }
              body {
                font-family: system-ui, -apple-system, sans-serif;
              }
              .preview-content {
                max-width: 800px;
                margin: 0 auto;
              }
            </style>
          </head>
          <body>
            <div class="preview-content">
              ${printContent}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 250);
              };
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const handleExportPDF = async () => {
    if (previewRef.current) {
      try {
        const doc = await generatePDF(previewRef.current);
        doc.save(`invoice-${form.getValues().number}.pdf`);
      } catch (error) {
        toast.error("Failed to generate PDF");
      }
    }
  };

  const getFieldLabel = (fieldId: string) => {
    const labels = {
      gst: 'GST Number',
      taxId: 'Tax ID',
      vatNumber: 'VAT Number',
      customerId: 'Customer ID',
      referenceNumber: 'Reference Number',
      projectCode: 'Project Code'
    };
    return labels[fieldId] || fieldId;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="button-airbnb">
          <Eye className="w-4 h-4 mr-2" />
          Preview Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <div className="flex flex-col h-[90vh]">
          <div className="flex justify-between items-center p-4 border-b">
            <DialogTitle>Invoice Preview</DialogTitle>
            <div className="flex items-center gap-2">
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
                onClick={handlePrint}
                className="button-airbnb"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <DialogClose />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div ref={previewRef}>
              <Preview form={form} />
            </div>
          </div>
          <div className="p-4 border-t text-center text-sm text-muted-foreground">
            <p>Made with ❤️ by Invoice Maker <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">FREE</span></p>
            <p className="text-xs mt-1">
              <a 
                href="https://invoicemakerfree.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                invoicemakerfree.com
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
