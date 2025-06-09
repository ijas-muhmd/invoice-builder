"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useFinancial } from "@/contexts/financial-context"
import { type PaymentMethod } from "@/lib/db"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const paymentMethodSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  type: z.enum(['Bank Account', 'Credit Card', 'Debit Card', 'UPI', 'PayPal', 'Cash', 'Digital Wallet', 'Net Banking', 'Other']),
  details: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'Bank Account') {
    if (!data.bankName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bank Name is required for Bank Account.",
        path: ['bankName'],
      });
    }
    if (!data.accountNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Account Number is required for Bank Account.",
        path: ['accountNumber'],
      });
    }
    if (!data.ifscCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IFSC Code is required for Bank Account.",
        path: ['ifscCode'],
      });
    }
  } else if (data.type === 'Credit Card') {
    if (!data.cardNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card Number is required for Credit Card.",
        path: ['cardNumber'],
      });
    }
    if (!data.expiryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry Date is required for Credit Card.",
        path: ['expiryDate'],
      });
    }
    if (!data.cvv) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CVV is required for Credit Card.",
        path: ['cvv'],
      });
    }
  } else if (data.type === 'PayPal') {
    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for PayPal.",
        path: ['email'],
      });
    }
  } else if (data.type === 'Other') {
    if (!data.details) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Details are required for Other payment method.",
        path: ['details'],
      });
    }
  }
  return data;
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod;
  onSuccess: () => void;
  onCancel: () => void;
}

const getTypeColor = (type: PaymentMethod['type']) => {
  switch (type) {
    case 'Bank Account':
      return 'bg-blue-100 text-blue-800'
    case 'Credit Card':
      return 'bg-purple-100 text-purple-800'
    case 'Debit Card':
      return 'bg-green-100 text-green-800'
    case 'UPI':
      return 'bg-yellow-100 text-yellow-800'
    case 'PayPal':
      return 'bg-indigo-100 text-indigo-800'
    case 'Cash':
      return 'bg-gray-100 text-gray-800'
    case 'Digital Wallet':
      return 'bg-pink-100 text-pink-800'
    case 'Net Banking':
      return 'bg-orange-100 text-orange-800'
    case 'Other':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function PaymentMethodForm({ paymentMethod, onSuccess, onCancel }: PaymentMethodFormProps) {
  const { addPaymentMethod, updatePaymentMethod } = useFinancial();

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: paymentMethod?.name || '',
      type: paymentMethod?.type || 'Bank Account',
      details: paymentMethod?.details || '',
    },
  });

  useEffect(() => {
    if (paymentMethod) {
      form.reset({
        name: paymentMethod.name,
        type: paymentMethod.type,
        details: paymentMethod.details || '',
      });
    } else {
      form.reset({
        name: '',
        type: 'Bank Account',
        details: '',
      });
    }
  }, [paymentMethod, form]);

  const onSubmit = (values: PaymentMethodFormValues) => {
    try {
      if (paymentMethod) {
        updatePaymentMethod({
          ...paymentMethod,
          ...values,
          workspaceId: paymentMethod.workspaceId,
          createdAt: paymentMethod.createdAt,
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: "Payment Method Updated",
          description: "Your payment method has been updated successfully.",
        });
      } else {
        addPaymentMethod(values);
        toast({
          title: "Payment Method Added",
          description: "Your new payment method has been added successfully.",
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({
        title: "Error",
        description: "Failed to save payment method. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Main Bank Account" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment method type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Bank Account">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor('Bank Account')}>Bank Account</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="Credit Card">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor('Credit Card')}>Credit Card</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="Debit Card">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor('Debit Card')}>Debit Card</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="UPI">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor('UPI')}>UPI</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="PayPal">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor('PayPal')}>PayPal</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="Cash">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor('Cash')}>Cash</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="Digital Wallet">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor('Digital Wallet')}>Digital Wallet</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="Net Banking">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor('Net Banking')}>Net Banking</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="Other">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getTypeColor('Other')}>Other</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Details (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional details about this payment method" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button">
            {paymentMethod ? "Update" : "Add"} Payment Method
          </Button>
        </div>
      </form>
    </Form>
  );
} 