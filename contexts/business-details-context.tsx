"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useWorkspace } from "./workspace-context"

interface BusinessDetails {
  name: string
  email: string
  address: string
  phone: string
  taxNumber: string
  postalCode: string
  logo?: string
}

interface BusinessDetailsContextType {
  businessDetails: BusinessDetails
  setBusinessDetails: (details: BusinessDetails) => void
}

const BusinessDetailsContext = createContext<BusinessDetailsContextType>({
  businessDetails: {
    name: "",
    email: "",
    address: "",
    phone: "",
    taxNumber: "",
    postalCode: "",
    logo: "",
  },
  setBusinessDetails: () => {},
})

export function BusinessDetailsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentWorkspace, updateBusinessDetails } = useWorkspace()
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>(() => {
    if (currentWorkspace) {
      return currentWorkspace.businessDetails
    }
    return {
      name: "",
      email: "",
      address: "",
      phone: "",
      taxNumber: "",
      postalCode: "",
      logo: "",
    }
  })

  // Update business details when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      setBusinessDetails(currentWorkspace.businessDetails)
    }
  }, [currentWorkspace])

  // Update workspace business details when they change
  const handleSetBusinessDetails = (details: BusinessDetails) => {
    setBusinessDetails(details)
    if (currentWorkspace) {
      updateBusinessDetails(currentWorkspace.id, details)
    }
  }

  return (
    <BusinessDetailsContext.Provider 
      value={{ 
        businessDetails, 
        setBusinessDetails: handleSetBusinessDetails 
      }}
    >
      {children}
    </BusinessDetailsContext.Provider>
  )
}

export const useBusinessDetails = () => useContext(BusinessDetailsContext) 