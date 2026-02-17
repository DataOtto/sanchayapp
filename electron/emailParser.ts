import { gmail_v1 } from 'googleapis';
import crypto from 'crypto';

export interface ParsedTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'credit' | 'debit';
  source: string;
  merchant?: string;
  rawData?: Record<string, any>;
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

export interface ParsedEmail {
  transactions: ParsedTransaction[];
  subscription?: ParsedSubscription;
}

// Known subscription services
const SUBSCRIPTION_PATTERNS: Record<string, { name: string; category: string; cycle: 'monthly' | 'yearly' }> = {
  'netflix': { name: 'Netflix', category: 'Entertainment', cycle: 'monthly' },
  'spotify': { name: 'Spotify', category: 'Entertainment', cycle: 'monthly' },
  'amazon prime': { name: 'Amazon Prime', category: 'Shopping', cycle: 'yearly' },
  'chatgpt': { name: 'ChatGPT Plus', category: 'Productivity', cycle: 'monthly' },
  'openai': { name: 'OpenAI', category: 'Productivity', cycle: 'monthly' },
  'youtube premium': { name: 'YouTube Premium', category: 'Entertainment', cycle: 'monthly' },
  'disney+': { name: 'Disney+', category: 'Entertainment', cycle: 'monthly' },
  'hotstar': { name: 'Disney+ Hotstar', category: 'Entertainment', cycle: 'monthly' },
  'aws': { name: 'AWS', category: 'Cloud Services', cycle: 'monthly' },
  'google workspace': { name: 'Google Workspace', category: 'Productivity', cycle: 'monthly' },
  'microsoft 365': { name: 'Microsoft 365', category: 'Productivity', cycle: 'monthly' },
  'dropbox': { name: 'Dropbox', category: 'Productivity', cycle: 'monthly' },
  'notion': { name: 'Notion', category: 'Productivity', cycle: 'monthly' },
  'figma': { name: 'Figma', category: 'Design', cycle: 'monthly' },
  'github': { name: 'GitHub', category: 'Development', cycle: 'monthly' },
  'vercel': { name: 'Vercel', category: 'Cloud Services', cycle: 'monthly' },
  'render': { name: 'Render', category: 'Cloud Services', cycle: 'monthly' },
  'railway': { name: 'Railway', category: 'Cloud Services', cycle: 'monthly' },
  'zerodha': { name: 'Zerodha', category: 'Investment', cycle: 'monthly' },
  'groww': { name: 'Groww', category: 'Investment', cycle: 'monthly' },
  'swiggy one': { name: 'Swiggy One', category: 'Food', cycle: 'monthly' },
  'zomato pro': { name: 'Zomato Pro', category: 'Food', cycle: 'monthly' },
};

// Merchant patterns for categorization
const MERCHANT_CATEGORIES: Record<string, string> = {
  'swiggy': 'Food',
  'zomato': 'Food',
  'dominos': 'Food',
  'mcdonalds': 'Food',
  'starbucks': 'Food',
  'uber eats': 'Food',
  'dunzo': 'Food',
  'blinkit': 'Food',
  'zepto': 'Food',
  'bigbasket': 'Groceries',
  'amazon': 'Shopping',
  'flipkart': 'Shopping',
  'myntra': 'Shopping',
  'nykaa': 'Shopping',
  'ajio': 'Shopping',
  'uber': 'Transport',
  'ola': 'Transport',
  'rapido': 'Transport',
  'irctc': 'Transport',
  'makemytrip': 'Travel',
  'goibibo': 'Travel',
  'cleartrip': 'Travel',
  'airbnb': 'Travel',
  'oyo': 'Travel',
  'paytm': 'Bills',
  'phonepe': 'Bills',
  'google pay': 'Bills',
  'electricity': 'Utilities',
  'gas': 'Utilities',
  'water': 'Utilities',
  'airtel': 'Telecom',
  'jio': 'Telecom',
  'vodafone': 'Telecom',
  'vi': 'Telecom',
  'bsnl': 'Telecom',
  'groww': 'Investment',
  'zerodha': 'Investment',
  'upstox': 'Investment',
  'kuvera': 'Investment',
  'mutual fund': 'Investment',
  'sip': 'Investment',
  'emi': 'EMI',
  'loan': 'EMI',
  'insurance': 'Insurance',
  'lic': 'Insurance',
  'hdfc life': 'Insurance',
  'icici prudential': 'Insurance',
  'salary': 'Salary',
  'credited': 'Salary',
};

function generateId(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex').substring(0, 16);
}

function extractEmailBody(message: gmail_v1.Schema$Message): string {
  let body = '';

  if (message.payload?.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  } else if (message.payload?.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.parts) {
        for (const subpart of part.parts) {
          if (subpart.body?.data) {
            body += Buffer.from(subpart.body.data, 'base64').toString('utf-8');
          }
        }
      }
    }
  }

  // Strip HTML tags
  body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  return body;
}

function getHeader(message: gmail_v1.Schema$Message, name: string): string {
  const header = message.payload?.headers?.find(h => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

function parseAmount(text: string): number | null {
  // Match various currency formats
  const patterns = [
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:\$|USD)\s*([\d,]+(?:\.\d{2})?)/i,
    /([\d,]+(?:\.\d{2})?)\s*(?:Rs\.?|INR|₹)/i,
    /amount[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{2})?)/i,
    /debited[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{2})?)/i,
    /credited[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{2})?)/i,
    /paid[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return null;
}

function parseDate(text: string, internalDate?: string): string {
  // Try to extract date from text
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
    /(?:on|dated?)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
  }

  // Fallback to email internal date
  if (internalDate) {
    return new Date(parseInt(internalDate)).toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

function detectMerchant(text: string, from: string): string | undefined {
  const combined = `${from} ${text}`.toLowerCase();

  for (const merchant of Object.keys(MERCHANT_CATEGORIES)) {
    if (combined.includes(merchant)) {
      return merchant.charAt(0).toUpperCase() + merchant.slice(1);
    }
  }

  return undefined;
}

function detectCategory(text: string, merchant?: string): string {
  const lowerText = text.toLowerCase();

  if (merchant) {
    const lowerMerchant = merchant.toLowerCase();
    for (const [pattern, category] of Object.entries(MERCHANT_CATEGORIES)) {
      if (lowerMerchant.includes(pattern)) {
        return category;
      }
    }
  }

  for (const [pattern, category] of Object.entries(MERCHANT_CATEGORIES)) {
    if (lowerText.includes(pattern)) {
      return category;
    }
  }

  // Check for common keywords
  if (lowerText.includes('salary') || lowerText.includes('credited to your account')) return 'Salary';
  if (lowerText.includes('refund')) return 'Refund';
  if (lowerText.includes('cashback')) return 'Cashback';
  if (lowerText.includes('dividend')) return 'Investment';
  if (lowerText.includes('interest')) return 'Interest';
  if (lowerText.includes('atm') || lowerText.includes('cash withdrawal')) return 'Cash';
  if (lowerText.includes('transfer')) return 'Transfer';

  return 'Other';
}

function detectTransactionType(text: string): 'credit' | 'debit' {
  const lowerText = text.toLowerCase();

  const creditKeywords = ['credited', 'received', 'refund', 'cashback', 'salary', 'deposit', 'added'];
  const debitKeywords = ['debited', 'spent', 'paid', 'charged', 'withdrawn', 'deducted', 'purchase'];

  for (const keyword of creditKeywords) {
    if (lowerText.includes(keyword)) return 'credit';
  }

  for (const keyword of debitKeywords) {
    if (lowerText.includes(keyword)) return 'debit';
  }

  // Default to debit if amount found but no clear indicator
  return 'debit';
}

function detectSubscription(text: string, from: string, amount: number): ParsedSubscription | undefined {
  const combined = `${from} ${text}`.toLowerCase();

  for (const [pattern, info] of Object.entries(SUBSCRIPTION_PATTERNS)) {
    if (combined.includes(pattern)) {
      const currency = combined.includes('$') || combined.includes('usd') ? 'USD' : 'INR';

      return {
        id: generateId(`${info.name}-${amount}`),
        name: info.name,
        amount,
        currency,
        billingCycle: info.cycle,
        category: info.category,
      };
    }
  }

  // Check for subscription keywords
  if (
    combined.includes('subscription') ||
    combined.includes('renewal') ||
    combined.includes('auto-renew') ||
    combined.includes('recurring')
  ) {
    // Try to extract service name from subject or sender
    const fromMatch = from.match(/(?:noreply@|support@|billing@)([^.]+)/);
    if (fromMatch) {
      const serviceName = fromMatch[1].charAt(0).toUpperCase() + fromMatch[1].slice(1);
      return {
        id: generateId(`${serviceName}-${amount}`),
        name: serviceName,
        amount,
        currency: 'INR',
        billingCycle: 'monthly',
        category: 'Other',
      };
    }
  }

  return undefined;
}

export function parseFinancialEmail(message: gmail_v1.Schema$Message): ParsedEmail {
  const result: ParsedEmail = {
    transactions: [],
  };

  const from = getHeader(message, 'From');
  const subject = getHeader(message, 'Subject');
  const body = extractEmailBody(message);
  const fullText = `${subject} ${body}`;

  const amount = parseAmount(fullText);

  if (!amount || amount < 1) {
    return result;
  }

  const date = parseDate(fullText, message.internalDate || undefined);
  const type = detectTransactionType(fullText);
  const merchant = detectMerchant(fullText, from);
  const category = detectCategory(fullText, merchant);

  // Check for subscription
  const subscription = detectSubscription(fullText, from, amount);
  if (subscription) {
    result.subscription = subscription;
  }

  // Create transaction
  const transaction: ParsedTransaction = {
    id: generateId(`${message.id}-${amount}-${date}`),
    date,
    amount,
    description: subject.substring(0, 200),
    category,
    type,
    source: from.match(/@([^.]+)/)?.[1] || 'Unknown',
    merchant,
    rawData: {
      emailId: message.id,
      from,
      subject,
      snippet: message.snippet,
    },
  };

  result.transactions.push(transaction);

  return result;
}
