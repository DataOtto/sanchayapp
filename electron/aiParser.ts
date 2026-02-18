import OpenAI from 'openai';
import crypto from 'crypto';
import { gmail_v1 } from 'googleapis';
import Store from 'electron-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Store() as any;

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

const CATEGORIES = [
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

  // Strip HTML tags and clean up
  body = body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  // Limit body length for API efficiency
  return body.substring(0, 3000);
}

function getHeader(message: gmail_v1.Schema$Message, name: string): string {
  const header = message.payload?.headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value || '';
}

export function getOpenAIKey(): string | null {
  return store.get('openai_api_key') as string | null;
}

export function setOpenAIKey(key: string): void {
  store.set('openai_api_key', key);
}

export function clearOpenAIKey(): void {
  store.delete('openai_api_key');
}

export async function parseEmailWithAI(
  message: gmail_v1.Schema$Message
): Promise<ParsedEmail> {
  const result: ParsedEmail = {
    transactions: [],
  };

  const apiKey = getOpenAIKey();
  if (!apiKey) {
    console.log('No OpenAI API key configured, skipping AI parsing');
    return result;
  }

  const from = getHeader(message, 'From');
  const subject = getHeader(message, 'Subject');
  const body = extractEmailBody(message);
  const emailDate = message.internalDate
    ? new Date(parseInt(message.internalDate)).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  // Skip if no meaningful content
  if (!subject && !body) {
    return result;
  }

  const openai = new OpenAI({ apiKey });

  const prompt = `Analyze this email and determine if it contains financial transaction information.

FROM: ${from}
SUBJECT: ${subject}
BODY: ${body}

If this email contains a financial transaction (bank alert, payment confirmation, receipt, invoice, subscription charge, salary credit, refund, etc.), extract the following information in JSON format:

{
  "isFinancial": true/false,
  "transaction": {
    "amount": <number>,
    "currency": "<USD/EUR/GBP/INR/etc>",
    "type": "<income/expense/transfer>",
    "category": "<one of: ${CATEGORIES.join(', ')}>",
    "merchant": "<merchant/company name if identifiable>",
    "description": "<brief description of the transaction>",
    "date": "<YYYY-MM-DD if mentioned, otherwise null>"
  },
  "subscription": {
    "name": "<service name>",
    "amount": <number>,
    "currency": "<currency code>",
    "billingCycle": "<monthly/yearly/weekly/quarterly>",
    "category": "<category>"
  } // only include if this is a recurring subscription
}

If this is NOT a financial email (newsletters, promotions, social media, etc.), return:
{"isFinancial": false}

Important:
- income includes: salary, freelance payments, refunds, cashback, dividends, interest
- expense includes: purchases, bills, subscriptions, fees
- transfer includes: money transfers between accounts
- Only return valid JSON, no explanations`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a financial email parser. Extract transaction details from emails accurately. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return result;
    }

    // Parse JSON response
    let parsed: AIParseResult;
    try {
      // Handle potential markdown code blocks
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error('Failed to parse AI response:', content);
      return result;
    }

    if (!parsed.isFinancial || !parsed.transaction) {
      return result;
    }

    const txn = parsed.transaction;

    // Create transaction
    const transaction: ParsedTransaction = {
      id: generateId(`${message.id}-${txn.amount}-${emailDate}`),
      date: txn.date || emailDate,
      amount: txn.amount,
      description: txn.description || subject.substring(0, 200),
      category: txn.category || 'Other',
      type: txn.type === 'income' ? 'credit' : 'debit',
      source: from.match(/@([^.>]+)/)?.[1] || 'Unknown',
      merchant: txn.merchant,
      rawData: {
        emailId: message.id,
        from,
        subject,
        snippet: message.snippet,
        currency: txn.currency,
      },
    };

    result.transactions.push(transaction);

    // Add subscription if detected
    if (parsed.subscription) {
      const sub = parsed.subscription;
      result.subscription = {
        id: generateId(`${sub.name}-${sub.amount}`),
        name: sub.name,
        amount: sub.amount,
        currency: sub.currency || 'USD',
        billingCycle: sub.billingCycle || 'monthly',
        category: sub.category || 'Subscription',
      };
    }
  } catch (error) {
    console.error('AI parsing error:', error);
  }

  return result;
}

// Batch parse multiple emails efficiently
export async function parseEmailsWithAI(
  messages: gmail_v1.Schema$Message[],
  onProgress?: (processed: number, total: number) => void
): Promise<ParsedEmail[]> {
  const results: ParsedEmail[] = [];
  const total = messages.length;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const parsed = await parseEmailWithAI(message);
    results.push(parsed);

    if (onProgress) {
      onProgress(i + 1, total);
    }

    // Small delay to avoid rate limiting
    if (i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
