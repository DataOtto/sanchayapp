import crypto from 'crypto';
import { getDatabase } from './database';
import { logger } from './logger';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'credit' | 'debit';
  source?: string;
  merchant?: string;
  email_id?: string;
  rawData?: any;
}

export interface TransactionCheckResult {
  isDuplicate: boolean;
  isReversal: boolean;
  duplicateOf?: string;
  reversalOf?: string;
  originalTransaction?: Transaction;
}

/**
 * Generate a hash for a transaction to detect duplicates
 * Hash is based on: date, amount, description (normalized), type, source
 */
export function generateTransactionHash(tx: Transaction): string {
  const normalizedDescription = normalizeDescription(tx.description);
  const hashInput = `${tx.date}|${tx.amount}|${normalizedDescription}|${tx.type}|${tx.source || ''}`;
  return crypto.createHash('md5').update(hashInput).digest('hex');
}

/**
 * Normalize description for comparison
 * Removes extra spaces, converts to lowercase, removes common prefixes
 */
function normalizeDescription(description: string): string {
  if (!description) return '';

  return description
    .toLowerCase()
    .trim()
    // Remove common prefixes
    .replace(/^(upi|imps|neft|rtgs|atm|pos|ecs|nach)[-\/\s]*/i, '')
    // Remove transaction IDs and reference numbers
    .replace(/\b[a-z0-9]{12,}\b/gi, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a transaction is a duplicate or reversal
 */
export function checkTransaction(tx: Transaction): TransactionCheckResult {
  const db = getDatabase();
  const result: TransactionCheckResult = {
    isDuplicate: false,
    isReversal: false,
  };

  // Generate hash for this transaction
  const hash = generateTransactionHash(tx);

  // Check for exact duplicate by hash
  const existingByHash = db.prepare(
    'SELECT id, date, amount, description, type, source FROM transactions WHERE hash = ? AND id != ?'
  ).get(hash, tx.id) as Transaction | undefined;

  if (existingByHash) {
    logger.warning('Transaction', `Duplicate detected: "${tx.description}" matches existing transaction`);
    result.isDuplicate = true;
    result.duplicateOf = existingByHash.id;
    return result;
  }

  // Check for similar transactions within same day (fuzzy duplicate detection)
  const similarTransactions = db.prepare(`
    SELECT id, date, amount, description, type, source, merchant
    FROM transactions
    WHERE date = ?
      AND amount = ?
      AND type = ?
      AND id != ?
      AND is_duplicate = 0
  `).all(tx.date, tx.amount, tx.type, tx.id) as Transaction[];

  for (const existing of similarTransactions) {
    const similarity = calculateSimilarity(
      normalizeDescription(tx.description),
      normalizeDescription(existing.description)
    );

    if (similarity > 0.8) {
      logger.warning('Transaction', `Similar transaction found (${(similarity * 100).toFixed(0)}% match): "${tx.description}"`);
      result.isDuplicate = true;
      result.duplicateOf = existing.id;
      return result;
    }
  }

  // Check for reversal (credit matching a recent debit or vice versa)
  if (tx.type === 'credit') {
    // Look for a matching debit in the last 30 days that could be reversed
    const potentialReversals = db.prepare(`
      SELECT id, date, amount, description, type, source, merchant
      FROM transactions
      WHERE type = 'debit'
        AND amount = ?
        AND reversed_by IS NULL
        AND date >= date(?, '-30 days')
        AND date <= ?
      ORDER BY date DESC
      LIMIT 5
    `).all(tx.amount, tx.date, tx.date) as Transaction[];

    for (const debit of potentialReversals) {
      // Check if description suggests a refund/reversal
      const isRefundDescription = isRefundRelated(tx.description);
      const merchantMatch = checkMerchantMatch(tx, debit);

      if (isRefundDescription && merchantMatch) {
        logger.info('Transaction', `Reversal detected: "${tx.description}" reverses "${debit.description}"`);
        result.isReversal = true;
        result.reversalOf = debit.id;
        result.originalTransaction = debit;
        return result;
      }
    }
  }

  return result;
}

/**
 * Check if description suggests a refund/reversal
 */
function isRefundRelated(description: string): boolean {
  const refundKeywords = [
    'refund',
    'reversal',
    'reversed',
    'cashback',
    'return',
    'cancelled',
    'canceled',
    'failed',
    'rejected',
    'credit back',
    'money back',
    'chargeback',
  ];

  const lowerDesc = description.toLowerCase();
  return refundKeywords.some(keyword => lowerDesc.includes(keyword));
}

/**
 * Check if two transactions are from the same merchant
 */
function checkMerchantMatch(tx1: Transaction, tx2: Transaction): boolean {
  // Check merchant field
  if (tx1.merchant && tx2.merchant) {
    return tx1.merchant.toLowerCase() === tx2.merchant.toLowerCase();
  }

  // Extract potential merchant from description
  const merchant1 = extractMerchant(tx1.description);
  const merchant2 = extractMerchant(tx2.description);

  if (merchant1 && merchant2) {
    return merchant1.toLowerCase() === merchant2.toLowerCase();
  }

  // Fallback: check if descriptions share significant words
  const words1 = new Set(normalizeDescription(tx1.description).split(' ').filter(w => w.length > 3));
  const words2 = new Set(normalizeDescription(tx2.description).split(' ').filter(w => w.length > 3));

  let matches = 0;
  for (const word of words1) {
    if (words2.has(word)) matches++;
  }

  return matches >= 2;
}

/**
 * Extract merchant name from description
 */
function extractMerchant(description: string): string | null {
  // Common patterns for merchant names
  const patterns = [
    /(?:to|from|at|@)\s+([A-Za-z0-9\s]+?)(?:\s+(?:upi|ref|txn|id)|$)/i,
    /(?:amazon|flipkart|swiggy|zomato|uber|ola|netflix|spotify|google|apple)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

/**
 * Calculate similarity between two strings (Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const set1 = new Set(str1.split(' '));
  const set2 = new Set(str2.split(' '));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Mark a transaction as reversed
 */
export function markTransactionReversed(originalId: string, reversalId: string): void {
  const db = getDatabase();

  db.prepare('UPDATE transactions SET reversed_by = ? WHERE id = ?').run(reversalId, originalId);
  db.prepare('UPDATE transactions SET reverses = ? WHERE id = ?').run(originalId, reversalId);

  logger.success('Transaction', `Linked reversal: ${reversalId} reverses ${originalId}`);
}

/**
 * Mark a transaction as duplicate
 */
export function markTransactionDuplicate(duplicateId: string, originalId: string): void {
  const db = getDatabase();

  db.prepare('UPDATE transactions SET is_duplicate = 1 WHERE id = ?').run(duplicateId);

  logger.info('Transaction', `Marked as duplicate: ${duplicateId} (duplicate of ${originalId})`);
}

/**
 * Save transaction with duplicate and reversal checking
 */
export function saveTransaction(tx: Transaction): { saved: boolean; reason?: string } {
  const db = getDatabase();
  const hash = generateTransactionHash(tx);

  // Check for duplicates and reversals
  const check = checkTransaction(tx);

  if (check.isDuplicate) {
    // Still save but mark as duplicate
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO transactions
      (id, date, amount, description, category, type, source, email_id, merchant, raw_data, hash, is_duplicate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    stmt.run(
      tx.id,
      tx.date,
      tx.amount,
      tx.description,
      tx.category,
      tx.type,
      tx.source,
      tx.email_id,
      tx.merchant,
      JSON.stringify(tx.rawData),
      hash
    );

    return { saved: true, reason: 'duplicate' };
  }

  // Save the transaction
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO transactions
    (id, date, amount, description, category, type, source, email_id, merchant, raw_data, hash, reverses)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    tx.id,
    tx.date,
    tx.amount,
    tx.description,
    tx.category,
    tx.type,
    tx.source,
    tx.email_id,
    tx.merchant,
    JSON.stringify(tx.rawData),
    hash,
    check.reversalOf || null
  );

  // If this is a reversal, update the original transaction
  if (check.isReversal && check.reversalOf) {
    markTransactionReversed(check.reversalOf, tx.id);
  }

  return { saved: true, reason: check.isReversal ? 'reversal' : undefined };
}
