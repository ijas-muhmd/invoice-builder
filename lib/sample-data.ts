import { Customer } from '@/contexts/customer-context'
import { Invoice } from '@/contexts/invoice-context'

export const sampleCustomers: Omit<Customer, 'id' | 'createdAt' | 'workspaceId'>[] = [
  {
    businessName: "Acme Corporation",
    email: "contact@acmecorp.com",
    address: "123 Business Ave, New York, NY 10001",
    phone: "+1 (555) 123-4567",
    notes: "Major client - always pays on time"
  },
  {
    businessName: "TechStart Inc",
    email: "billing@techstart.io",
    address: "456 Innovation Blvd, San Francisco, CA 94107",
    phone: "+1 (555) 987-6543",
    notes: "Growing startup, occasional payment delays"
  },
  {
    businessName: "Global Solutions Ltd",
    email: "accounts@globalsolutions.co.uk",
    address: "789 Enterprise Street, London, UK",
    phone: "+44 20 7946 0958",
    notes: "International client, pays in GBP"
  },
  {
    businessName: "Local Services Co",
    email: "info@localservices.com",
    address: "321 Main Street, Small Town, ST 12345",
    phone: "+1 (555) 456-7890",
    notes: "Small local business"
  }
]

export const generateSampleInvoices = (customers: Customer[]): Omit<Invoice, 'id' | 'createdAt' | 'workspaceId' | 'updatedAt'>[] => {
  const invoices: Omit<Invoice, 'id' | 'createdAt' | 'workspaceId' | 'updatedAt'>[] = []
  
  customers.forEach((customer, customerIndex) => {
    // Generate 3-5 invoices per customer
    const invoiceCount = Math.floor(Math.random() * 3) + 3
    
    for (let i = 0; i < invoiceCount; i++) {
      const baseDate = new Date()
      baseDate.setMonth(baseDate.getMonth() - Math.floor(Math.random() * 6)) // Last 6 months
      
      const dueDate = new Date(baseDate)
      dueDate.setDate(dueDate.getDate() + 30) // 30 days payment terms
      
      const currency = customer.businessName.includes('Global') ? 'GBP' : 
                      customer.businessName.includes('Tech') ? 'USD' : 'EUR'
      
      const itemCount = Math.floor(Math.random() * 3) + 1
      const items = []
      
      for (let j = 0; j < itemCount; j++) {
        items.push({
          description: `Service ${j + 1} for ${customer.businessName}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          rate: Math.floor(Math.random() * 200) + 50
        })
      }
      
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
      const tax = Math.floor(Math.random() * 20) + 5 // 5-25% tax
      const shipping = Math.floor(Math.random() * 50)
      const discount = Math.floor(Math.random() * 100)
      
      // Random payment status
      const statuses = ['draft', 'pending', 'paid', 'overdue']
      const status = statuses[Math.floor(Math.random() * statuses.length)] as any
      
      // If paid, amount paid = total, otherwise random partial payment
      const total = subtotal + (subtotal * tax / 100) + shipping - discount
      let amountPaid = 0
      
      if (status === 'paid') {
        amountPaid = total
      } else if (status === 'pending' || status === 'overdue') {
        amountPaid = Math.random() > 0.5 ? Math.floor(total * Math.random() * 0.5) : 0
      }
      
      invoices.push({
        number: `INV-${String(customerIndex + 1).padStart(2, '0')}${String(i + 1).padStart(2, '0')}`,
        date: baseDate.toISOString(),
        dueDate: dueDate.toISOString(),
        currency,
        status,
        customerId: customer.id,
        from: {
          name: "Your Business Name",
          email: "billing@yourbusiness.com",
          address: "Your Business Address\nCity, State, ZIP",
          phone: "+1 (555) 000-0000"
        },
        to: {
          businessName: customer.businessName,
          address: customer.address
        },
        items,
        tax,
        shipping,
        discount,
        amountPaid,
        notes: `Invoice for services provided to ${customer.businessName}`,
        terms: "Payment due within 30 days",
        paymentTerms: "Net 30",
        itemLabels: {
          description: "DESCRIPTION",
          quantity: "QTY", 
          price: "PRICE",
          amount: "AMOUNT"
        }
      })
    }
  })
  
  return invoices
}

export const createSampleData = (
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void,
  addInvoice: (invoice: any, status: any) => void,
  currentWorkspaceId: string
) => {
  // Add sample customers
  const createdCustomers: Customer[] = []
  
  sampleCustomers.forEach(customerData => {
    const customer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      workspaceId: currentWorkspaceId
    }
    createdCustomers.push(customer)
    addCustomer(customer)
  })
  
  // Add sample invoices
  const sampleInvoices = generateSampleInvoices(createdCustomers)
  sampleInvoices.forEach(invoiceData => {
    addInvoice({
      ...invoiceData,
      date: new Date(invoiceData.date),
      dueDate: new Date(invoiceData.dueDate)
    }, invoiceData.status)
  })
  
  return {
    customersAdded: createdCustomers.length,
    invoicesAdded: sampleInvoices.length
  }
} 