export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'credit' | 'debit';
  source: string;
  email_id?: string;
  merchant?: string;
  raw_data?: string;
  created_at?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  next_billing_date?: string;
  category: string;
  status: 'active' | 'paused' | 'cancelled';
  email_id?: string;
  logo_url?: string;
  last_detected?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategorySpending {
  category: string;
  total: number;
}

export interface MonthlySpending {
  month: string;
  total: number;
}

export interface BalanceSummary {
  total_income: number;
  total_expense: number;
}

export interface Insight {
  id: number;
  type: 'saving' | 'warning' | 'tip' | 'achievement';
  title: string;
  description: string;
  data?: Record<string, any>;
  created_at?: string;
  dismissed?: boolean;
}

export interface SyncProgress {
  processed: number;
  total: number;
  newTransactions: number;
}

// Electron API types
export interface ElectronAPI {
  db: {
    getTransactions: (filters?: TransactionFilters) => Promise<Transaction[]>;
    addTransaction: (transaction: Partial<Transaction>) => Promise<void>;
    bulkAddTransactions: (transactions: Partial<Transaction>[]) => Promise<void>;
    getSubscriptions: () => Promise<Subscription[]>;
    addSubscription: (subscription: Partial<Subscription>) => Promise<void>;
    getSpendingByCategory: (params: { startDate: string; endDate: string }) => Promise<CategorySpending[]>;
    getMonthlySpending: (params: { year: number }) => Promise<MonthlySpending[]>;
    getIncomeSummary: (params: { startDate: string; endDate: string }) => Promise<CategorySpending[]>;
    getTotalBalance: () => Promise<BalanceSummary>;
    getSetting: (key: string) => Promise<any>;
    setSetting: (key: string, value: any) => Promise<void>;
    isEmailProcessed: (emailId: string) => Promise<boolean>;
    markEmailProcessed: (emailId: string) => Promise<void>;
  };
  gmail: {
    checkAuth: () => Promise<{ authenticated: boolean }>;
    authenticate: () => Promise<{ success: boolean; error?: string }>;
    disconnect: () => Promise<{ success: boolean; error?: string }>;
    syncEmails: (options?: { fullSync?: boolean }) => Promise<{ success: boolean; processedCount?: number; newTransactions?: number; error?: string }>;
    getLastSync: () => Promise<string | null>;
    onSyncProgress: (callback: (data: SyncProgress) => void) => () => void;
  };
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'credit' | 'debit';
  limit?: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
