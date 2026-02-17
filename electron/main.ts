import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import serve from 'electron-serve';
import { initDatabase, getDatabase } from './database';
import { setupGmailHandlers } from './gmail';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'out' });
}

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Initialize database
  initDatabase();

  // Setup IPC handlers
  setupIpcHandlers();
  setupGmailHandlers();

  if (isProd) {
    await mainWindow.loadURL('app://./');
  } else {
    // Try port 3000 first, fall back to 3001
    try {
      await mainWindow.loadURL('http://localhost:3000');
    } catch {
      await mainWindow.loadURL('http://localhost:3001');
    }
    mainWindow.webContents.openDevTools();
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function setupIpcHandlers() {
  const db = getDatabase();

  // Transaction handlers
  ipcMain.handle('db:getTransactions', async (_, filters) => {
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (filters?.startDate) {
      query += ' AND date >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND date <= ?';
      params.push(filters.endDate);
    }
    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY date DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('db:addTransaction', async (_, transaction) => {
    const stmt = db.prepare(`
      INSERT INTO transactions (id, date, amount, description, category, type, source, email_id, merchant, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      transaction.id,
      transaction.date,
      transaction.amount,
      transaction.description,
      transaction.category,
      transaction.type,
      transaction.source,
      transaction.emailId,
      transaction.merchant,
      JSON.stringify(transaction.rawData)
    );
  });

  ipcMain.handle('db:bulkAddTransactions', async (_, transactions) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO transactions (id, date, amount, description, category, type, source, email_id, merchant, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((txns: any[]) => {
      for (const t of txns) {
        stmt.run(t.id, t.date, t.amount, t.description, t.category, t.type, t.source, t.emailId, t.merchant, JSON.stringify(t.rawData));
      }
    });

    return insertMany(transactions);
  });

  // Subscription handlers
  ipcMain.handle('db:getSubscriptions', async () => {
    return db.prepare('SELECT * FROM subscriptions ORDER BY next_billing_date ASC').all();
  });

  ipcMain.handle('db:addSubscription', async (_, subscription) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO subscriptions (id, name, amount, currency, billing_cycle, next_billing_date, category, status, email_id, logo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      subscription.id,
      subscription.name,
      subscription.amount,
      subscription.currency,
      subscription.billingCycle,
      subscription.nextBillingDate,
      subscription.category,
      subscription.status,
      subscription.emailId,
      subscription.logoUrl
    );
  });

  // Analytics handlers
  ipcMain.handle('db:getSpendingByCategory', async (_, { startDate, endDate }) => {
    return db.prepare(`
      SELECT category, SUM(amount) as total
      FROM transactions
      WHERE type = 'debit' AND date >= ? AND date <= ?
      GROUP BY category
      ORDER BY total DESC
    `).all(startDate, endDate);
  });

  ipcMain.handle('db:getMonthlySpending', async (_, { year }) => {
    return db.prepare(`
      SELECT strftime('%m', date) as month, SUM(amount) as total
      FROM transactions
      WHERE type = 'debit' AND strftime('%Y', date) = ?
      GROUP BY month
      ORDER BY month ASC
    `).all(year.toString());
  });

  ipcMain.handle('db:getIncomeSummary', async (_, { startDate, endDate }) => {
    return db.prepare(`
      SELECT category, SUM(amount) as total
      FROM transactions
      WHERE type = 'credit' AND date >= ? AND date <= ?
      GROUP BY category
      ORDER BY total DESC
    `).all(startDate, endDate);
  });

  ipcMain.handle('db:getTotalBalance', async () => {
    const result = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_expense
      FROM transactions
    `).get() as { total_income: number; total_expense: number };
    return result;
  });

  // Settings handlers
  ipcMain.handle('db:getSetting', async (_, key) => {
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return result?.value ? JSON.parse(result.value) : null;
  });

  ipcMain.handle('db:setSetting', async (_, key, value) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    return stmt.run(key, JSON.stringify(value));
  });

  // Processed emails tracking
  ipcMain.handle('db:isEmailProcessed', async (_, emailId) => {
    const result = db.prepare('SELECT id FROM processed_emails WHERE email_id = ?').get(emailId);
    return !!result;
  });

  ipcMain.handle('db:markEmailProcessed', async (_, emailId) => {
    const stmt = db.prepare('INSERT OR IGNORE INTO processed_emails (email_id, processed_at) VALUES (?, ?)');
    return stmt.run(emailId, new Date().toISOString());
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
