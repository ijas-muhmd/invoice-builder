import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, Category } from '@/contexts/financial-context'

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'Bank Account' | 'Credit Card' | 'Debit Card' | 'UPI' | 'PayPal' | 'Cash' | 'Digital Wallet' | 'Net Banking' | 'Other';
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  email?: string;
  details?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceDB extends DBSchema {
  invoices: {
    key: string;
    value: any;
  };
  drafts: {
    key: string;
    value: any;
  };
  settings: {
    key: string;
    value: any;
  };
  businesses: {
    key: string;
    value: any;
  };
  workspaces: {
    key: string;
    value: any;
  };
  bank_accounts: {
    key: string;
    value: any;
  };
  templates: {
    key: string;
    value: any;
  };
  financial_transactions: {
    key: string;
    value: {
      id: string;
      title: string;
      amount: number;
      currency: string;
      inrAmount: number;
      conversionRate?: number;
      category: string;
      date: string;
      description?: string;
      vendor?: string;
      customer?: string;
      receipt?: string;
      status: 'pending' | 'approved' | 'paid' | 'rejected';
      tags?: string[];
      type: 'expense' | 'income';
      invoiceId?: string;
      paymentMethodId?: string;
      workspaceId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  financial_expense_categories: {
    key: string;
    value: any;
  };
  financial_income_categories: {
    key: string;
    value: any;
  };
  payment_methods: {
    key: string;
    value: PaymentMethod;
  };
}

type StoreName = 'invoices' | 'drafts' | 'settings' | 'businesses' | 'workspaces' | 'bank_accounts' | 'templates' | 'financial_transactions' | 'financial_expense_categories' | 'financial_income_categories' | 'payment_methods';

export type { StoreName };

export interface IDatabase {
  getAll: (store: StoreName) => Promise<any[]>
  get: (store: StoreName, key: string) => Promise<any>
  set: (store: StoreName, key: string, value: any) => Promise<string>
  delete: (store: StoreName, key: string) => Promise<void>
  clear: (store: StoreName) => Promise<void>
  transactions: (field: string) => Promise<{
    equals: (value: string) => Promise<Transaction[]>
  }>
  expenseCategories: (field: string) => Promise<{
    equals: (value: string) => Promise<Category[]>
  }>
  incomeCategories: (field: string) => Promise<{
    equals: (value: string) => Promise<Category[]>
  }>
  paymentMethods: (field: string) => Promise<{
    equals: (value: string) => Promise<PaymentMethod[]>
  }>
}

class Database implements IDatabase {
  private db: IDBPDatabase<InvoiceDB> | null = null;
  private dbName = 'invoice-builder';
  private version = 5;

  async init() {
    if (this.db) return this.db;

    try {
      this.db = await openDB<InvoiceDB>(this.dbName, this.version, {
        upgrade: async (db, oldVersion, newVersion) => {
          // Create stores for version 1
          if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('invoices')) {
              db.createObjectStore('invoices', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('drafts')) {
              db.createObjectStore('drafts', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings'); // No keyPath for settings
            }
            if (!db.objectStoreNames.contains('businesses')) {
              db.createObjectStore('businesses', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('workspaces')) {
              db.createObjectStore('workspaces', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('bank_accounts')) {
              db.createObjectStore('bank_accounts', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('templates')) {
              db.createObjectStore('templates', { keyPath: 'id' });
            }
          }

          // Create financial stores for version 2
          if (oldVersion < 2) {
            if (!db.objectStoreNames.contains('financial_transactions')) {
              db.createObjectStore('financial_transactions', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('financial_expense_categories')) {
              db.createObjectStore('financial_expense_categories', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('financial_income_categories')) {
              db.createObjectStore('financial_income_categories', { keyPath: 'id' });
            }
          }

          // Add payment_methods store for version 4
          if (oldVersion < 4) {
            if (!db.objectStoreNames.contains('payment_methods')) {
              db.createObjectStore('payment_methods', { keyPath: 'id' });
            }
          }
        },
        blocked() {
          console.warn('Database access blocked');
        },
        blocking() {
          console.warn('Database access blocking');
        },
        terminated() {
          console.warn('Database connection terminated');
        }
      });

      // Run migrations
      await this.migrateTransactions();

      return this.db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async get(store: StoreName, key: string) {
    try {
      const db = await this.init();
      return db.get(store, key);
    } catch (error) {
      console.error(`Error getting value from ${store}:`, error);
      return undefined;
    }
  }

  async set(store: StoreName, key: string, value: any) {
    try {
      const db = await this.init();
      // Check the object store's keyPath at runtime
      const tx = db.transaction(store, 'readwrite');
      const objectStore = tx.objectStore(store);
      const hasKeyPath = !!objectStore.keyPath;
      if (hasKeyPath) {
        return db.put(store, value);
      } else {
        return db.put(store, value, key);
      }
    } catch (error) {
      console.error(`Error setting value in ${store}:`, error);
      throw error;
    }
  }

  async delete(store: StoreName, key: string) {
    try {
      const db = await this.init();
      return db.delete(store, key);
    } catch (error) {
      console.error(`Error deleting value from ${store}:`, error);
      throw error;
    }
  }

  async getAll(store: StoreName) {
    try {
      const db = await this.init();
      return db.getAll(store);
    } catch (error) {
      console.error(`Error getting all values from ${store}:`, error);
      return [];
    }
  }

  async clear(store: StoreName) {
    try {
      const db = await this.init();
      return db.clear(store);
    } catch (error) {
      console.error(`Error clearing ${store}:`, error);
      throw error;
    }
  }

  async transactions(field: string) {
    const db = await this.init();
    return {
      equals: async (value: string) => {
        const transactions = await db.getAll('financial_transactions');
        return transactions.filter((transaction: Transaction) => transaction[field as keyof Transaction] === value) as Transaction[];
      }
    };
  }

  async expenseCategories(field: string) {
    const db = await this.init();
    return {
      equals: async (value: string) => {
        const categories = await db.getAll('financial_expense_categories');
        return categories.filter((category: Category) => category[field as keyof Category] === value) as Category[];
      }
    };
  }

  async incomeCategories(field: string) {
    const db = await this.init();
    return {
      equals: async (value: string) => {
        const categories = await db.getAll('financial_income_categories');
        return categories.filter((category: Category) => category[field as keyof Category] === value) as Category[];
      }
    };
  }

  async paymentMethods(field: string) {
    const db = await this.init();
    return {
      equals: async (value: string) => {
        const paymentMethods = await db.getAll('payment_methods');
        return paymentMethods.filter((method: PaymentMethod) => method[field as keyof PaymentMethod] === value) as PaymentMethod[];
      }
    };
  }

  async migrateTransactions() {
    const db = await this.init();
    const transactions = await db.getAll('financial_transactions');
    
    for (const transaction of transactions) {
      if (typeof transaction.inrAmount !== 'number') {
        const updatedTransaction = {
          ...transaction,
          inrAmount: transaction.currency === 'INR' ? transaction.amount : 
            (transaction.amount * (transaction.conversionRate || 1))
        };
        await db.put('financial_transactions', updatedTransaction, transaction.id);
      }
    }
  }
}

export const db = new Database(); 