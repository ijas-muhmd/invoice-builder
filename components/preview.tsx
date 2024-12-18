"use client"

import { type UseFormReturn } from "react-hook-form"
import { type InvoiceFormValues } from "@/app/invoice-schema"
import { format } from "date-fns"
import Image from "next/image"

interface PreviewProps {
  form: UseFormReturn<InvoiceFormValues>
}

const getCurrencySymbol = (currency: string) => {
  try {
    return (0).toLocaleString(
      'en-US',
      {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    ).replace(/\d/g, '').trim();
  } catch (e) {
    // Fallback to currency code if symbol is not available
    return currency;
  }
};

export function Preview({ form }: PreviewProps) {
  const data = form.getValues()
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const tax = subtotal * (data.tax / 100)
  const total = subtotal + tax + data.shipping - data.discount

  return (
    <div className="min-h-screen bg-white p-8 max-w-3xl mx-auto text-sm relative">
      <div className="pb-16">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {data.logo && (
              <div className="mb-4 relative w-32 h-32">
                <Image
                  src={data.logo}
                  alt="Business Logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h1>
            <div className="text-gray-600 space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-500">INVOICE NO</p>
                <p className="font-medium text-gray-600">{data.number}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">ISSUE DATE</p>
                <p>{format(data.date, 'MMM dd, yyyy').toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">DUE DATE</p>
                <p>{format(data.dueDate, 'MMM dd, yyyy').toUpperCase()}</p>
              </div>
              {data.paymentTerms && (
                <div>
                  <p className="text-xs font-medium text-gray-500">PAYMENT TERMS</p>
                  <p>{data.paymentTerms}</p>
                </div>
              )}
              {data.poNumber && (
                <div>
                  <p className="text-xs font-medium text-gray-500">PO NUMBER</p>
                  <p>{data.poNumber}</p>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div>
              <p className="text-xs font-medium text-gray-500">AMOUNT DUE</p>
              <div className="flex items-center justify-end mt-1">
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-medium text-gray-900">
                    {getCurrencySymbol(data.currency)}
                  </span>
                </div>
                <p className="font-bold text-xl text-blue-600">
                  {total.toLocaleString('en-US', { 
                    style: 'currency', 
                    currency: data.currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Fields */}
        {(data.gst || data.taxId || data.vatNumber || data.customerId || data.referenceNumber || data.projectCode) && (
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-4">
              {data.gst && (
                <div>
                  <p className="text-xs font-medium text-gray-500">GST NUMBER</p>
                  <p className="font-medium text-gray-600">{data.gst}</p>
                </div>
              )}
              {data.taxId && (
                <div>
                  <p className="text-xs font-medium text-gray-500">TAX ID</p>
                  <p className="font-medium text-gray-600">{data.taxId}</p>
                </div>
              )}
              {data.vatNumber && (
                <div>
                  <p className="text-xs font-medium text-gray-500">VAT NUMBER</p>
                  <p className="font-medium text-gray-600">{data.vatNumber}</p>
                </div>
              )}
              {data.customerId && (
                <div>
                  <p className="text-xs font-medium text-gray-500">CUSTOMER ID</p>
                  <p className="font-medium text-gray-600">{data.customerId}</p>
                </div>
              )}
              {data.referenceNumber && (
                <div>
                  <p className="text-xs font-medium text-gray-500">REFERENCE NUMBER</p>
                  <p className="font-medium text-gray-600">{data.referenceNumber}</p>
                </div>
              )}
              {data.projectCode && (
                <div>
                  <p className="text-xs font-medium text-gray-500">PROJECT CODE</p>
                  <p className="font-medium text-gray-600">{data.projectCode}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* From/To Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xs font-medium text-gray-500 mb-2">FROM</h2>
            <div className="space-y-0.5 text-gray-900">
              <p className="font-medium text-gray-600">{data.from.name}</p>
              <p className="text-gray-600">{data.from.address}</p>
              {data.from.email && (
                <p className="text-gray-600">{data.from.email}</p>
              )}
              {data.from.phone && (
                <p className="text-gray-600">{data.from.phone}</p>
              )}
              {data.from.taxNumber && (
                <p className="text-gray-600">Tax Number: {data.from.taxNumber}</p>
              )}
              {data.from.postalCode && (
                <p className="text-gray-600">Postal Code: {data.from.postalCode}</p>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-xs font-medium text-gray-500 mb-2">TO</h2>
            <div className="space-y-0.5 text-gray-900">
              <p className="font-medium text-gray-600">{data.to.businessName}</p>
              <p className="text-gray-600">{data.to.address}</p>
              {data.to.optional && (
                <p className="text-gray-600">{data.to.optional}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h2 className="text-xs font-medium text-gray-500 mb-2">ITEMS</h2>
          <table className="w-full">
            <thead>
              <tr className="border-y border-gray-200">
                <th className="py-2 text-left text-xs font-medium text-gray-500">
                  {data.itemLabels?.description || "DESCRIPTION"}
                </th>
                <th className="py-2 text-right text-xs font-medium text-gray-500">
                  {data.itemLabels?.quantity || "QTY"}
                </th>
                <th className="py-2 text-right text-xs font-medium text-gray-500">
                  {data.itemLabels?.price || "PRICE"}
                </th>
                <th className="py-2 text-right text-xs font-medium text-gray-500">
                  {data.itemLabels?.amount || "AMOUNT"}
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {data.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{item.rate.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 text-right">{data.currency} {(item.quantity * item.rate).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-4">
            <div className="w-64 space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-500">SUBTOTAL</p>
                <p className="text-right font-medium text-gray-900">{data.currency} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              {data.tax > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500">TAX ({data.tax}%)</p>
                  <p className="text-right font-medium text-gray-900">{data.currency} {tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              {data.shipping > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500">SHIPPING</p>
                  <p className="text-right font-medium text-gray-900">{data.currency} {data.shipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              {data.discount > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500">DISCOUNT</p>
                  <p className="text-right font-medium text-gray-900">-{data.currency} {data.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500">TOTAL AMOUNT</p>
                <p className="text-right font-bold text-gray-900">{data.currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details Section */}
        {data.bankDetails && (
          <div className="mb-8">
            <h2 className="text-xs font-medium text-gray-500 mb-2">BANK DETAILS</h2>
            <div className="text-gray-600 text-sm whitespace-pre-wrap">
              {data.bankDetails}
            </div>
          </div>
        )}

        {/* Notes Section */}
        {data.notes && (
          <div className="mb-8">
            <h2 className="text-xs font-medium text-gray-500 mb-2">NOTES</h2>
            <p className="text-gray-600 text-sm">{data.notes}</p>
          </div>
        )}

        {/* Terms & Conditions Section */}
        {data.termsAndConditions && (
          <div className="mb-8">
            <h2 className="text-xs font-medium text-gray-500 mb-2">TERMS & CONDITIONS</h2>
            <div className="text-gray-600 text-sm whitespace-pre-wrap">
              {data.termsAndConditions}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <div className="flex items-center justify-center text-gray-400 text-xs">
          <span>Made with</span>
          <span className="text-red-400 mx-1">♥</span>
          <span>by</span>
          <a 
            href="https://invoicemakerfree.com" 
            className="ml-1 font-medium text-gray-500 hover:text-gray-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            invoicemakerfree.com
          </a>
        </div>
      </div>
    </div>
  )
} 