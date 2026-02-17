import { ipcMain, BrowserWindow, shell } from 'electron';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getDatabase } from './database';
import { parseFinancialEmail, type ParsedTransaction } from './emailParser';
import http from 'http';
import url from 'url';

// You'll need to get these from Google Cloud Console
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:8085/oauth2callback';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

let oauth2Client: OAuth2Client | null = null;

function getOAuth2Client(): OAuth2Client {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
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

  ipcMain.handle('gmail:checkAuth', async () => {
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('gmail_tokens') as { value: string } | undefined;
    if (setting?.value) {
      const tokens = JSON.parse(setting.value);
      const client = getOAuth2Client();
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
    try {
      const client = getOAuth2Client();

      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });

      // Open auth URL in browser
      shell.openExternal(authUrl);

      // Wait for callback
      const code = await startLocalServer();

      // Exchange code for tokens
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // Save tokens
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('gmail_tokens', JSON.stringify(tokens));

      return { success: true };
    } catch (error) {
      console.error('Gmail auth error:', error);
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

  ipcMain.handle('gmail:syncEmails', async (event, options?: { fullSync?: boolean }) => {
    try {
      const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('gmail_tokens') as { value: string } | undefined;
      if (!setting?.value) {
        return { success: false, error: 'Not authenticated' };
      }

      const client = getOAuth2Client();
      client.setCredentials(JSON.parse(setting.value));

      const gmail = google.gmail({ version: 'v1', auth: client });

      // Search queries for financial emails
      const searchQueries = [
        'from:(alerts@hdfcbank.net OR alerts@icicibank.com OR alerts@axisbank.com OR alerts@sbi.co.in OR noreply@paytm.com)',
        'subject:(transaction OR payment OR debit OR credit OR "amount" OR receipt OR invoice)',
        'from:(noreply@netflix.com OR noreply@spotify.com OR receipts@amazon.in OR noreply@swiggy.in OR auto-confirm@amazon.in)',
        'from:(zerodha OR groww OR upstox) subject:(statement OR trade OR dividend)',
        'subject:(salary credited OR salary credit)',
      ];

      const allMessages: any[] = [];
      let processedCount = 0;
      let newTransactions = 0;

      for (const query of searchQueries) {
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: options?.fullSync ? 500 : 50,
        });

        if (response.data.messages) {
          allMessages.push(...response.data.messages);
        }
      }

      // Remove duplicates
      const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values());

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

          const parsed = parseFinancialEmail(fullMessage.data);

          if (parsed.transactions.length > 0) {
            // Store transactions
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO transactions (id, date, amount, description, category, type, source, email_id, merchant, raw_data)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const tx of parsed.transactions) {
              stmt.run(
                tx.id,
                tx.date,
                tx.amount,
                tx.description,
                tx.category,
                tx.type,
                tx.source,
                message.id,
                tx.merchant,
                JSON.stringify(tx.rawData)
              );
              newTransactions++;
            }
          }

          if (parsed.subscription) {
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
          console.error('Error processing email:', message.id, error);
        }
      }

      // Update last sync time
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_sync', JSON.stringify(new Date().toISOString()));

      return { success: true, processedCount, newTransactions };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gmail:getLastSync', async () => {
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_sync') as { value: string } | undefined;
    return setting?.value ? JSON.parse(setting.value) : null;
  });
}
