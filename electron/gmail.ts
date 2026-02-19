import { ipcMain, BrowserWindow, shell } from 'electron';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Store from 'electron-store';
import { getDatabase } from './database';
import { parseFinancialEmail } from './emailParser';
import { parseEmailWithAI, getAIConfig } from './ai';
import { logger } from './logger';
import { saveTransaction, Transaction } from './transactionUtils';
import http from 'http';
import url from 'url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Store() as any;

const REDIRECT_URI = 'http://localhost:8085/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

let oauth2Client: OAuth2Client | null = null;

// Google OAuth credential management
export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
}

export function getGoogleCredentials(): GoogleCredentials | null {
  const clientId = store.get('google_client_id') as string | undefined;
  const clientSecret = store.get('google_client_secret') as string | undefined;

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

export function setGoogleCredentials(credentials: GoogleCredentials): void {
  store.set('google_client_id', credentials.clientId);
  store.set('google_client_secret', credentials.clientSecret);
  // Reset OAuth client when credentials change
  oauth2Client = null;
}

export function clearGoogleCredentials(): void {
  store.delete('google_client_id');
  store.delete('google_client_secret');
  oauth2Client = null;
}

export function hasGoogleCredentials(): boolean {
  const creds = getGoogleCredentials();
  return !!(creds?.clientId && creds?.clientSecret);
}

export function getMaskedGoogleCredentials(): { clientId: string | null; clientSecret: string | null } {
  const creds = getGoogleCredentials();
  return {
    clientId: creds?.clientId ? creds.clientId.substring(0, 20) + '...' : null,
    clientSecret: creds?.clientSecret ? '••••••••' + creds.clientSecret.slice(-4) : null,
  };
}

function getOAuth2Client(): OAuth2Client | null {
  const creds = getGoogleCredentials();
  if (!creds) {
    return null;
  }

  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret, REDIRECT_URI);
  }
  return oauth2Client;
}

async function startLocalServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = url.parse(req.url || '', true);
        if (parsedUrl.pathname === '/oauth2callback') {
          const code = parsedUrl.query.code as string;

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f0f0f; color: white;">
                <div style="text-align: center;">
                  <h1>Authentication Successful!</h1>
                  <p>You can close this window and return to Sanchay.</p>
                </div>
              </body>
            </html>
          `);

          server.close();
          resolve(code);
        }
      } catch (error) {
        reject(error);
      }
    });

    server.listen(8085, () => {
      console.log('OAuth callback server listening on port 8085');
    });

    server.on('error', reject);
  });
}

export function setupGmailHandlers() {
  const db = getDatabase();

  // Google credentials handlers
  ipcMain.handle('google:getCredentials', async () => {
    return getMaskedGoogleCredentials();
  });

  ipcMain.handle('google:setCredentials', async (_, credentials: GoogleCredentials) => {
    setGoogleCredentials(credentials);
    return { success: true };
  });

  ipcMain.handle('google:clearCredentials', async () => {
    clearGoogleCredentials();
    // Also clear tokens when credentials are cleared
    db.prepare('DELETE FROM settings WHERE key = ?').run('gmail_tokens');
    return { success: true };
  });

  ipcMain.handle('google:hasCredentials', async () => {
    return hasGoogleCredentials();
  });

  // Gmail auth handlers
  ipcMain.handle('gmail:checkAuth', async () => {
    if (!hasGoogleCredentials()) {
      return { authenticated: false, error: 'credentials_missing' };
    }

    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('gmail_tokens') as { value: string } | undefined;
    if (setting?.value) {
      const tokens = JSON.parse(setting.value);
      const client = getOAuth2Client();
      if (!client) {
        return { authenticated: false, error: 'credentials_missing' };
      }
      client.setCredentials(tokens);

      // Verify tokens are still valid
      try {
        await client.getAccessToken();
        return { authenticated: true };
      } catch {
        return { authenticated: false };
      }
    }
    return { authenticated: false };
  });

  ipcMain.handle('gmail:authenticate', async () => {
    if (!hasGoogleCredentials()) {
      logger.warning('Gmail', 'Authentication failed - no credentials configured');
      return { success: false, error: 'Please configure Google API credentials first' };
    }

    try {
      logger.info('Gmail', 'Starting OAuth authentication...');
      const client = getOAuth2Client();
      if (!client) {
        logger.error('Gmail', 'Failed to create OAuth client');
        return { success: false, error: 'Failed to create OAuth client' };
      }

      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });

      // Open auth URL in browser
      logger.info('Gmail', 'Opening browser for authentication');
      shell.openExternal(authUrl);

      // Wait for callback
      const code = await startLocalServer();
      logger.info('Gmail', 'Received OAuth callback');

      // Exchange code for tokens
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // Save tokens
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('gmail_tokens', JSON.stringify(tokens));

      logger.success('Gmail', 'Authentication successful');
      return { success: true };
    } catch (error) {
      logger.error('Gmail', 'Authentication failed', (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gmail:disconnect', async () => {
    try {
      db.prepare('DELETE FROM settings WHERE key = ?').run('gmail_tokens');
      oauth2Client = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gmail:syncEmails', async (event, options?: { fullSync?: boolean; daysBack?: number }) => {
    if (!hasGoogleCredentials()) {
      logger.warning('Gmail', 'Sync failed - no credentials configured');
      return { success: false, error: 'Google credentials not configured' };
    }

    try {
      const daysBack = options?.daysBack || 30; // Default to 30 days
      logger.info('Sync', `Starting sync for last ${daysBack} days...`);

      const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('gmail_tokens') as { value: string } | undefined;
      if (!setting?.value) {
        logger.error('Sync', 'Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }

      const client = getOAuth2Client();
      if (!client) {
        logger.error('Sync', 'Failed to create OAuth client');
        return { success: false, error: 'Failed to create OAuth client' };
      }
      client.setCredentials(JSON.parse(setting.value));

      const gmail = google.gmail({ version: 'v1', auth: client });

      // Check if AI parsing is enabled
      const aiConfig = getAIConfig();
      const useAI = aiConfig.enabled;
      logger.info('Sync', `Using ${useAI ? `${aiConfig.type} AI` : 'regex'} parser for email processing`);

      // Get user's preferred currency
      const currencySetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('user_currency') as { value: string } | undefined;
      const userCurrency = currencySetting?.value || 'INR';
      logger.info('Sync', `Filtering for currency: ${userCurrency}`);

      // Calculate date filter
      const afterDate = new Date();
      afterDate.setDate(afterDate.getDate() - daysBack);
      const afterDateStr = `${afterDate.getFullYear()}/${String(afterDate.getMonth() + 1).padStart(2, '0')}/${String(afterDate.getDate()).padStart(2, '0')}`;
      const dateFilter = `after:${afterDateStr}`;
      logger.info('Sync', `Date filter: ${dateFilter}`);

      // Search queries for financial emails - broader when using AI
      const baseQueries = useAI
        ? [
            // With AI, we can cast a wider net
            'subject:(transaction OR payment OR receipt OR invoice OR order OR purchase)',
            'subject:(subscription OR renewal OR billing OR charged)',
            'subject:(salary OR credited OR deposit OR refund OR cashback)',
            'from:(bank OR pay OR wallet OR finance)',
            'subject:(statement OR summary)',
          ]
        : [
            // Without AI, use specific patterns
            'subject:(transaction OR payment OR debit OR credit OR receipt OR invoice)',
            'subject:(subscription OR renewal OR billing)',
            'subject:(salary credited OR deposit)',
          ];

      // Add date filter to all queries
      const searchQueries = baseQueries.map(q => `${q} ${dateFilter}`);

      const allMessages: any[] = [];
      let processedCount = 0;
      let newTransactions = 0;

      for (const query of searchQueries) {
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 500, // Get more results since we're filtering by date
        });

        if (response.data.messages) {
          allMessages.push(...response.data.messages);
        }
      }

      // Remove duplicates
      const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values());
      logger.info('Sync', `Found ${uniqueMessages.length} unique emails to process`);

      // Send progress updates
      const mainWindow = BrowserWindow.getAllWindows()[0];

      for (const message of uniqueMessages) {
        // Check if already processed
        const existing = db.prepare('SELECT id FROM processed_emails WHERE email_id = ?').get(message.id);
        if (existing && !options?.fullSync) {
          continue;
        }

        try {
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full',
          });

          // Use AI parser if available, otherwise fall back to regex
          const parsed = useAI
            ? await parseEmailWithAI(fullMessage.data)
            : parseFinancialEmail(fullMessage.data);

          if (parsed.transactions.length > 0) {
            logger.success('Sync', `Found ${parsed.transactions.length} transaction(s) in email`, { emailId: message.id });

            for (const tx of parsed.transactions) {
              // Check currency - skip if doesn't match user's preferred currency
              const txCurrency = tx.rawData?.currency as string || 'INR';
              if (txCurrency.toUpperCase() !== userCurrency.toUpperCase()) {
                logger.warning('Sync', `Skipped ${txCurrency} transaction (user currency: ${userCurrency}): ${tx.description}`);
                continue;
              }

              // Use saveTransaction which handles duplicates and reversals
              const txData: Transaction = {
                id: tx.id,
                date: tx.date,
                amount: tx.amount,
                description: tx.description,
                category: tx.category,
                type: tx.type,
                source: tx.source,
                email_id: message.id,
                merchant: tx.merchant,
                rawData: tx.rawData,
              };

              const result = saveTransaction(txData);

              if (result.saved) {
                const currencySymbol = userCurrency === 'INR' ? '₹' : userCurrency === 'USD' ? '$' : userCurrency;
                if (result.reason === 'duplicate') {
                  logger.warning('Sync', `Skipped duplicate: ${tx.description} - ${currencySymbol}${tx.amount}`);
                } else if (result.reason === 'reversal') {
                  logger.info('Sync', `Saved reversal: ${tx.description} - ${currencySymbol}${tx.amount}`);
                  newTransactions++;
                } else {
                  logger.debug('Sync', `Saved: ${tx.description} - ${currencySymbol}${tx.amount} (${tx.type})`);
                  newTransactions++;
                }
              }
            }
          }

          if (parsed.subscription) {
            // Check subscription currency
            const subCurrency = parsed.subscription.currency || 'USD';
            if (subCurrency.toUpperCase() !== userCurrency.toUpperCase()) {
              logger.warning('Sync', `Skipped ${subCurrency} subscription (user currency: ${userCurrency}): ${parsed.subscription.name}`);
            } else {
              const stmt = db.prepare(`
                INSERT OR REPLACE INTO subscriptions (id, name, amount, currency, billing_cycle, next_billing_date, category, status, email_id, last_detected)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);
              stmt.run(
                parsed.subscription.id,
                parsed.subscription.name,
                parsed.subscription.amount,
                parsed.subscription.currency,
                parsed.subscription.billingCycle,
                parsed.subscription.nextBillingDate,
                parsed.subscription.category,
                'active',
                message.id,
                new Date().toISOString()
              );
              logger.info('Sync', `Saved subscription: ${parsed.subscription.name}`);
            }
          }

          // Mark as processed
          db.prepare('INSERT OR IGNORE INTO processed_emails (email_id, processed_at) VALUES (?, ?)').run(message.id, new Date().toISOString());
          processedCount++;

          // Send progress
          if (mainWindow) {
            mainWindow.webContents.send('gmail:syncProgress', {
              processed: processedCount,
              total: uniqueMessages.length,
              newTransactions,
            });
          }
        } catch (error) {
          logger.error('Sync', `Error processing email ${message.id}`, (error as Error).message);
        }
      }

      // Update last sync time
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_sync', JSON.stringify(new Date().toISOString()));

      logger.success('Sync', `Sync complete! Processed ${processedCount} emails, found ${newTransactions} new transactions`);
      return { success: true, processedCount, newTransactions };
    } catch (error) {
      logger.error('Sync', 'Sync failed', (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gmail:getLastSync', async () => {
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_sync') as { value: string } | undefined;
    return setting?.value ? JSON.parse(setting.value) : null;
  });
}
