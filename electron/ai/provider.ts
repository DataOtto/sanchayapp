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
    return `You are analyzing an email to extract financial transaction information. READ THE ENTIRE EMAIL CAREFULLY before responding.

=== EMAIL START ===
FROM: ${from}
SUBJECT: ${subject}
BODY: ${body}
=== EMAIL END ===

TASK: Determine if this email contains a financial transaction and extract details.

IMPORTANT RULES:
1. READ THE FULL EMAIL BODY - amounts, currency, and transaction type are often in the body, not the subject
2. Look for specific monetary amounts (e.g., "$49.99", "₹1,500", "Rs. 500", "USD 100")
3. Determine the CORRECT currency from the email (INR/₹/Rs for Indian Rupee, USD/$ for US Dollar, etc.)
4. Classify transaction type accurately:
   - INCOME: salary credited, payment received, refund processed, cashback, interest earned, dividend
   - EXPENSE: purchase, payment made, subscription charge, bill payment, fee deducted
   - TRANSFER: money sent to another account, internal transfer

5. For SUBSCRIPTIONS, look for:
   - Recurring billing mentions ("monthly", "annual", "your subscription")
   - Service names (Netflix, Spotify, AWS, etc.)
   - Renewal or charge notifications

RESPONSE FORMAT (JSON only, no other text):

If financial transaction found:
{
  "isFinancial": true,
  "transaction": {
    "amount": <number without currency symbol>,
    "currency": "<3-letter code: INR/USD/EUR/GBP/etc>",
    "type": "<income/expense/transfer>",
    "category": "<one of: ${CATEGORIES.join(', ')}>",
    "merchant": "<company/service name>",
    "description": "<what the transaction is for>",
    "date": "<YYYY-MM-DD or null>"
  },
  "subscription": <include ONLY if this is a recurring subscription charge> {
    "name": "<service name>",
    "amount": <number>,
    "currency": "<3-letter code>",
    "billingCycle": "<monthly/yearly/weekly/quarterly>",
    "category": "<category>"
  }
}

If NOT a financial email:
{"isFinancial": false}

CATEGORY GUIDELINES:
- Salary/Freelance: income from work
- Food & Dining: restaurants, food delivery (Swiggy, Zomato, UberEats)
- Groceries: grocery stores, supermarkets
- Shopping: Amazon, Flipkart, retail purchases
- Subscription: Netflix, Spotify, software subscriptions
- Cloud Services: AWS, Google Cloud, Azure, Vercel
- Utilities: electricity, water, gas bills
- Transport: Uber, Ola, fuel, parking
- Investment: stocks, mutual funds, crypto
- Refund/Cashback: money returned`;
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
