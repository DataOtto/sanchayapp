import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'sanchay.db');

  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    -- Transactions table: stores all financial transactions
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
      source TEXT,
      email_id TEXT,
      merchant TEXT,
      raw_data TEXT,
      reversed_by TEXT,
      reverses TEXT,
      is_duplicate INTEGER DEFAULT 0,
      hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Subscriptions table: tracks recurring payments
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly', 'quarterly')),
      next_billing_date TEXT,
      category TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
      email_id TEXT,
      logo_url TEXT,
      last_detected TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Settings table: app configuration
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Processed emails: track which emails have been processed
    CREATE TABLE IF NOT EXISTS processed_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id TEXT UNIQUE NOT NULL,
      processed_at TEXT NOT NULL
    );

    -- Insights table: stores generated insights
    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      dismissed INTEGER DEFAULT 0
    );

    -- Create indexes for faster queries
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_processed_emails_id ON processed_emails(email_id);
  `);

  // Run migrations for existing databases
  runMigrations(db);

  return db;
}

function runMigrations(database: Database.Database): void {
  // Check if columns exist and add them if not
  const tableInfo = database.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
  const columns = tableInfo.map(col => col.name);

  if (!columns.includes('reversed_by')) {
    database.exec('ALTER TABLE transactions ADD COLUMN reversed_by TEXT');
  }
  if (!columns.includes('reverses')) {
    database.exec('ALTER TABLE transactions ADD COLUMN reverses TEXT');
  }
  if (!columns.includes('is_duplicate')) {
    database.exec('ALTER TABLE transactions ADD COLUMN is_duplicate INTEGER DEFAULT 0');
  }
  if (!columns.includes('hash')) {
    database.exec('ALTER TABLE transactions ADD COLUMN hash TEXT');
    database.exec('CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash)');
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
