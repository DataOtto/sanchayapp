// Common types for all AI providers

export type AIProviderType = 'ollama' | 'openai' | 'gemini' | 'openrouter';

export interface AIProviderConfig {
  type: AIProviderType;
  enabled: boolean;
  // Provider-specific settings
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface AIProviderStatus {
  available: boolean;
  models?: string[];
  error?: string;
}

export interface ParsedTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'credit' | 'debit';
  source: string;
  merchant?: string;
  rawData?: Record<string, unknown>;
}

export interface ParsedSubscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  nextBillingDate?: string;
  category: string;
}

export interface AIParseResult {
  isFinancial: boolean;
  transaction?: {
    amount: number;
    currency: string;
    type: 'income' | 'expense' | 'transfer';
    category: string;
    merchant?: string;
    description: string;
    date?: string;
  };
  subscription?: {
    name: string;
    amount: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
    category: string;
  };
}

export interface ParsedEmail {
  transactions: ParsedTransaction[];
  subscription?: ParsedSubscription;
}

export const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Transport',
  'Travel',
  'Entertainment',
  'Utilities',
  'Telecom',
  'Healthcare',
  'Education',
  'Investment',
  'Insurance',
  'EMI & Loans',
  'Rent',
  'Salary',
  'Freelance',
  'Refund',
  'Cashback',
  'Transfer',
  'Subscription',
  'Cloud Services',
  'Software',
  'Other'
];
