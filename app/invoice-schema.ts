import * as z from "zod"

export const invoiceSchema = z.object({
  logo: z.string().optional(),
  number: z.string().min(1, "Invoice number is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  paymentTerms: z.string().optional(),
  poNumber: z.string().optional(),
  currency: z.string().default("EUR"),
  from: z.object({
    name: z.string().min(1, "Business name is required"),
    email: z.string().email("Invalid email address").optional(),
    address: z.string().min(1, "Address is required"),
    phone: z.string().optional(),
    taxNumber: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  to: z.object({
    businessName: z.string().min(1, "Business name is required"),
    address: z.string().min(1, "Address is required"),
    optional: z.string().optional(), // For additional shipping info
  }),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0, "Quantity must be positive"),
    rate: z.number().min(0, "Rate must be positive"),
  })).min(1, "At least one item is required"),
  tax: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  amountPaid: z.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  gst: z.string().optional(),
  taxId: z.string().optional(),
  vatNumber: z.string().optional(),
  customerId: z.string().optional(),
  referenceNumber: z.string().optional(),
  projectCode: z.string().optional(),
  bankDetails: z.string().optional(),
  termsAndConditions: z.string().optional(),
  itemDescriptionLabel: z.string().optional(),
  itemQuantityLabel: z.string().optional(),
  itemPriceLabel: z.string().optional(),
  itemAmountLabel: z.string().optional(),
  itemLabels: z.object({
    description: z.string().default("DESCRIPTION"),
    quantity: z.string().default("QTY"),
    price: z.string().default("PRICE"),
    amount: z.string().default("AMOUNT")
  }).default({
    description: "DESCRIPTION",
    quantity: "QTY",
    price: "PRICE",
    amount: "AMOUNT"
  }),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema> 
