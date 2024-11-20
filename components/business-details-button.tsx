"use client"

import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import { type UseFormReturn } from "react-hook-form"
import { type InvoiceFormValues } from "@/app/invoice-schema"
import { BusinessSelect } from "@/components/business-select"
import { useBusiness } from "@/contexts/business-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { useEffect } from 'react';

interface BusinessDetailsButtonProps {
  form: UseFormReturn<InvoiceFormValues>
}

export function BusinessDetailsButton({ form }: BusinessDetailsButtonProps) {
  const { currentWorkspace } = useWorkspace()
  const { getDefaultBusiness, getWorkspaceBusinesses } = useBusiness()

  const handleSelect = (business: any) => {
    form.setValue('from', {
      name: business.name,
      email: business.email,
      address: business.address,
      phone: business.phone,
      taxNumber: business.taxNumber,
      postalCode: business.postalCode,
    }, { shouldDirty: true });
    
    if (business.logo) {
      form.setValue('logo', business.logo, { shouldDirty: true });
    }

    if (business.gst) {
      form.setValue('gst', business.gst, { shouldDirty: true });
    }
    if (business.taxId) {
      form.setValue('taxId', business.taxId, { shouldDirty: true });
    }
    if (business.vatNumber) {
      form.setValue('vatNumber', business.vatNumber, { shouldDirty: true });
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      const defaultBusiness = getDefaultBusiness(currentWorkspace.id);
      if (defaultBusiness) {
        handleSelect(defaultBusiness);
      }
    }
  }, [currentWorkspace]);

  return (
    <div className="space-y-4">
      <BusinessSelect
        onSelect={handleSelect}
      />
      <p className="text-sm text-muted-foreground">
        Select a business profile or add a new one in preferences
      </p>
    </div>
  )
} 