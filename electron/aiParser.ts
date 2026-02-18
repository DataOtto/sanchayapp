import crypto from 'crypto';
import { gmail_v1 } from 'googleapis';
import Store from 'electron-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Store() as any;

const OLLAMA_DEFAULT_URL = 'http://localhost:11434';
const OLLAMA_DEFAULT_MODEL = 'llama3.2';

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

export interface OllamaConfig {
  enabled: boolean;
  url: string;
  model: string;
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

  // Limit body length for efficiency
  return body.substring(0, 3000);
}

function getHeader(message: gmail_v1.Schema$Message, name: string): string {
  const header = message.payload?.headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value || '';
}

// Ollama configuration functions
export function getOllamaConfig(): OllamaConfig {
  return {
    enabled: store.get('ollama_enabled', false) as boolean,
    url: store.get('ollama_url', OLLAMA_DEFAULT_URL) as string,
    model: store.get('ollama_model', OLLAMA_DEFAULT_MODEL) as string,
  };
}

export function setOllamaConfig(config: Partial<OllamaConfig>): void {
  if (config.enabled !== undefined) store.set('ollama_enabled', config.enabled);
  if (config.url) store.set('ollama_url', config.url);
  if (config.model) store.set('ollama_model', config.model);
}

export function clearOllamaConfig(): void {
  store.delete('ollama_enabled');
  store.delete('ollama_url');
  store.delete('ollama_model');
}

// Check if Ollama is running and accessible
export async function checkOllamaStatus(): Promise<{ running: boolean; models: string[] }> {
  const config = getOllamaConfig();
  try {
    const response = await fetch(`${config.url}/api/tags`);
    if (!response.ok) {
      return { running: false, models: [] };
    }
    const data = await response.json() as { models?: Array<{ name: string }> };
    const models = data.models?.map((m) => m.name) || [];
    return { running: true, models };
  } catch {
    return { running: false, models: [] };
  }
}

export async function parseEmailWithAI(
  message: gmail_v1.Schema$Message
): Promise<ParsedEmail> {
  const result: ParsedEmail = {
    transactions: [],
  };

  const config = getOllamaConfig();
  if (!config.enabled) {
    console.log('Ollama is not enabled, skipping AI parsing');
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

  const prompt = `Analyze this email and determine if it contains financial transaction information.

FROM: ${from}
SUBJECT: ${subject}
BODY: ${body}

If this email contains a financial transaction (bank alert, payment confirmation, receipt, invoice, subscription charge, salary credit, refund, etc.), extract the following information in JSON format:

{
  "isFinancial": true,
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
  }
}

If this is NOT a financial email (newsletters, promotions, social media, etc.), return:
{"isFinancial": false}

Important:
- income includes: salary, freelance payments, refunds, cashback, dividends, interest
- expense includes: purchases, bills, subscriptions, fees
- transfer includes: money transfers between accounts
- Only return valid JSON, no explanations or additional text`;

  try {
    const response = await fetch(`${config.url}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a financial email parser. Extract transaction details from emails accurately. Always respond with valid JSON only, no explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
        options: {
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      console.error('Ollama API error:', response.status, response.statusText);
      return result;
    }

    const data = await response.json() as { message?: { content?: string } };
    const content = data.message?.content?.trim();

    if (!content) {
      return result;
    }

    // Parse JSON response
    let parsed: AIParseResult;
    try {
      // Handle potential markdown code blocks
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      // Find the JSON object in the response
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', content);
        return result;
      }
      parsed = JSON.parse(jsonMatch[0]);
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

    // Small delay between requests
    if (i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  return results;
}
