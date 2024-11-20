"use client"

import * as z from "zod"

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  poNumber: z.string().optional(),
  from: z.object({
    name: z.string().min(1, "Business name is required"),
    email: z.string().email("Invalid email address"),
    address: z.string().min(1, "Address is required"),
    taxNumber: z.string().optional(),
    bankDetails: z.string().optional(),
  }),
  to: z.object({
    name: z.string().min(1, "Client name is required"),
    email: z.string().email("Invalid email address"),
    address: z.string().min(1, "Address is required"),
  }),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    hours: z.number().min(0, "Hours must be positive"),
    rate: z.number().min(0, "Rate must be positive"),
  })).min(1, "Add at least one item"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  tax: z.number().min(0, "Tax must be positive"),
  shipping: z.number().min(0, "Shipping must be positive"),
  discount: z.number().min(0, "Discount must be positive"),
  amountPaid: z.number().min(0, "Amount paid must be positive"),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>

export const defaultValues: Partial<InvoiceFormValues> = {
  invoiceNumber: "1",
  date: new Date(),
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  items: [{ description: "", hours: 1, rate: 0 }],
  tax: 0,
  shipping: 0,
  discount: 0,
  amountPaid: 0,
  notes: "",
  terms: "Payment is due within 14 days",
}