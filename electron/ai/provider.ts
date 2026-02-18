import { gmail_v1 } from 'googleapis';
import {
  AIProviderConfig,
  AIProviderStatus,
  ParsedEmail,
  AIParseResult,
  ParsedTransaction,
  ParsedSubscription,
  CATEGORIES,
} from './types';
import crypto from 'crypto';

// Abstract base class for AI providers
export abstract class AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  // Check if the provider is available and working
  abstract checkStatus(): Promise<AIProviderStatus>;

  // Parse email content and return structured data
  abstract parseContent(prompt: string): Promise<AIParseResult | null>;

  // Helper to generate unique IDs
  protected generateId(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex').substring(0, 16);
  }

  // Build the prompt for parsing emails
  protected buildPrompt(from: string, subject: string, body: string): string {
    return `Analyze this email and determine if it contains financial transaction information.

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
  }

  // Parse email with AI
  async parseEmail(message: gmail_v1.Schema$Message): Promise<ParsedEmail> {
    const result: ParsedEmail = {
      transactions: [],
    };

    if (!this.config.enabled) {
      return result;
    }

    const from = this.getHeader(message, 'From');
    const subject = this.getHeader(message, 'Subject');
    const body = this.extractEmailBody(message);
    const emailDate = message.internalDate
      ? new Date(parseInt(message.internalDate)).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    if (!subject && !body) {
      return result;
    }

    const prompt = this.buildPrompt(from, subject, body);

    try {
      const parsed = await this.parseContent(prompt);

      if (!parsed || !parsed.isFinancial || !parsed.transaction) {
        return result;
      }

      const txn = parsed.transaction;

      const transaction: ParsedTransaction = {
        id: this.generateId(`${message.id}-${txn.amount}-${emailDate}`),
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

      if (parsed.subscription) {
        const sub = parsed.subscription;
        result.subscription = {
          id: this.generateId(`${sub.name}-${sub.amount}`),
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

  // Extract email body from Gmail message
  protected extractEmailBody(message: gmail_v1.Schema$Message): string {
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

    return body.substring(0, 3000);
  }

  // Get header from Gmail message
  protected getHeader(message: gmail_v1.Schema$Message, name: string): string {
    const header = message.payload?.headers?.find(
      (h) => h.name?.toLowerCase() === name.toLowerCase()
    );
    return header?.value || '';
  }
}
