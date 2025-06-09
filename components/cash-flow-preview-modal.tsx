"use client"

import { useState, useRef } from "react"
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
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { type Transaction, type Category } from "@/contexts/financial-context"

interface CashFlowPreviewModalProps {
  filteredTransactions: Transaction[];
  cashFlowTrend: { name: string; income: number; expenses: number; net: number }[];
  allCategories: Category[];
  netIncome: number;
  totalIncome: number;
  totalExpenses: number;
  filterCategory: string | "all";
  dateRange: { from?: Date; to?: Date | undefined } | undefined;
}

export function CashFlowPreviewModal({
  filteredTransactions,
  cashFlowTrend,
  allCategories,
  netIncome,
  totalIncome,
  totalExpenses,
  filterCategory,
  dateRange,
}: CashFlowPreviewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handlePrint = () => {
    const printContent = previewRef.current?.innerHTML || ''
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Cash Flow Report</title>
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
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #f2f2f2;
                }
                .text-right {
                  text-align: right;
                }
                .text-center {
                  text-align: center;
                }
                .capitalize {
                  text-transform: capitalize;
                }
                .hidden-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleExportPDF = async () => {
    if (previewRef.current) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render
        const canvas = await html2canvas(previewRef.current, {
          scale: 2, // Higher scale for better quality
          useCORS: true, // Enable CORS for images
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        const pdf = new jsPDF('p', 'mm', 'a4');
        let firstPage = true;

        while (heightLeft >= 0) {
          if (!firstPage) {
            pdf.addPage();
          }
          
          pdf.addImage(
            canvas.toDataURL('image/png'),
            'PNG',
            0,
            position,
            imgWidth,
            imgHeight,
            '',
            'FAST'
          );
          
          heightLeft -= pageHeight;
          position -= pageHeight;
          firstPage = false;
        }

        const fileName = `cash-flow-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        pdf.save(fileName);

        toast({
          title: "Export Successful",
          description: `Cash flow report exported as ${fileName}`,
        });
      } catch (error) {
        console.error('PDF Generation Error:', error);
        toast({
          title: "Export Failed",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowPreview(true)}
      >
        <Eye className="w-4 h-4 mr-2" />
        Preview Report
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl p-0">
          <div className="flex flex-col h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <DialogTitle>Cash Flow Report Preview</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <DialogClose />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <div ref={previewRef} className="p-8">
                <h1 className="text-2xl font-bold mb-4">Cash Flow Report</h1>
                <p className="text-gray-600 mb-6">Generated on: {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
                
                <div className="mb-6 p-4 border rounded-md bg-gray-50">
                  <h2 className="text-lg font-semibold mb-2">Summary</h2>
                  <p className="text-sm">Net Cash Flow: ₹{netIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm">Total Income: ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm">Total Expenses: ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  {filterCategory !== "all" && (
                    <p className="text-sm">Filtered by Category: {allCategories.find(cat => cat.id === filterCategory)?.name}</p>
                  )}
                  {dateRange?.from && (
                    <p className="text-sm">Filtered by Date Range: {format(dateRange.from, 'MMM dd, yyyy')} - {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'Today'}</p>
                  )}
                </div>

                <h2 className="text-lg font-medium text-gray-900 mb-4">Cash Flow Trend</h2>
                {cashFlowTrend.length > 0 ? (
                  <table className="w-full border-collapse text-sm mb-6">
                    <thead>
                      <tr className="border-b border-gray-300 bg-gray-100">
                        <th className="text-left py-2 px-4">Month</th>
                        <th className="text-left py-2 px-4">Income</th>
                        <th className="text-left py-2 px-4">Expenses</th>
                        <th className="text-left py-2 px-4">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashFlowTrend.map((month, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="py-2 px-4">{month.name}</td>
                          <td className="py-2 px-4">₹{month.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-4">₹{month.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-4">₹{month.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-8 text-gray-500">No cash flow trend data available for this report.</p>
                )}

                <h2 className="text-lg font-medium text-gray-900 mb-4">Detailed Transactions</h2>
                {filteredTransactions.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (INR)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(tx.date), 'MMM dd, yyyy')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{tx.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{allCategories.find(cat => cat.id === tx.category)?.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{tx.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{tx.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-8 text-gray-500">No transactions to display for this report.</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t text-center text-sm text-muted-foreground">
              <p>Generated by Invoice Builder</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 