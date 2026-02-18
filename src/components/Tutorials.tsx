'use client';

import { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Shield,
  Mail,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'easy' | 'medium';
  timeEstimate: string;
  content: TutorialSection[];
}

interface TutorialSection {
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'tip';
  code?: string;
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'google-auth',
    title: 'Setup Google Authentication',
    description: 'Connect your Gmail to automatically sync financial emails',
    icon: <Mail size={20} />,
    difficulty: 'medium',
    timeEstimate: '10 mins',
    content: [
      {
        title: 'Why Gmail Integration?',
        content: `Sanchay uses Gmail to automatically detect and categorize your financial transactions. Instead of manually entering every expense, Sanchay reads your bank alerts, payment confirmations, and subscription receipts to build your financial picture automatically.

**What Sanchay reads:**
- Bank transaction alerts (debits & credits)
- Payment confirmations (UPI, cards, wallets)
- Subscription receipts (Netflix, Spotify, etc.)
- Invoice emails

**What Sanchay NEVER does:**
- Send emails on your behalf
- Access non-financial emails
- Share your data with anyone
- Store data outside your device`,
        type: 'info',
      },
      {
        title: 'Why Your Own Google Credentials?',
        content: `Sanchay is privacy-first. Unlike other apps that use their own API keys (and could potentially access your data), Sanchay requires YOU to create your own Google API credentials.

**Benefits:**
- You have full control over the OAuth app
- You can revoke access anytime from Google Console
- No middleman - direct connection to your Gmail
- Your credentials never leave your device`,
        type: 'tip',
      },
      {
        title: 'Step 1: Create Google Cloud Project',
        content: `1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click the project dropdown (top-left, next to "Google Cloud")
4. Click **New Project**
5. Enter project name: \`Sanchay\`
6. Click **Create**
7. Wait for creation, then select your new project`,
      },
      {
        title: 'Step 2: Enable Gmail API',
        content: `1. In left sidebar, click **APIs & Services** → **Library**
2. In the search box, type \`Gmail API\`
3. Click on **Gmail API** from results
4. Click the blue **Enable** button
5. Wait for it to enable`,
      },
      {
        title: 'Step 3: Configure OAuth Consent Screen',
        content: `1. Go to **APIs & Services** → **OAuth consent screen**
   (In new UI: Look for **Audience** in left sidebar)

2. Select **External** and click **Create**

   > **Note:** External works for personal Gmail. Don't worry about verification - we'll use "Testing" mode which doesn't require it.

3. Fill in the form:`,
        code: `App name: Sanchay
User support email: your@email.com
Developer contact email: your@email.com`,
      },
      {
        title: 'Step 3 (continued): Add Scopes',
        content: `4. Click **Save and Continue**

5. On **Scopes** page:
   - Click **Add or Remove Scopes**
   - Search for \`gmail.readonly\`
   - Check the box for \`https://www.googleapis.com/auth/gmail.readonly\`
   - Click **Update**
   - Click **Save and Continue**`,
      },
      {
        title: 'Step 3 (continued): Add Test Users',
        content: `6. On **Test users** page:
   - Click **+ Add Users**
   - Enter your Gmail address (the one you'll use with Sanchay)
   - Click **Add**
   - Click **Save and Continue**

7. Review and click **Back to Dashboard**`,
        type: 'warning',
      },
      {
        title: 'Step 4: Create OAuth Credentials',
        content: `1. Go to **APIs & Services** → **Credentials**
   (In new UI: Click **Clients** in left sidebar)

2. Click **+ Create Credentials** at top
3. Select **OAuth client ID**

4. Fill in:`,
        code: `Application type: Desktop app
Name: Sanchay Desktop`,
      },
      {
        title: 'Step 5: Copy Your Credentials',
        content: `5. Click **Create**

6. A popup appears with your credentials:`,
        code: `Client ID: 123456789-xxxxxx.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxx`,
      },
      {
        title: 'Step 6: Add to Sanchay',
        content: `1. Open Sanchay app
2. Go to **Settings** (gear icon in sidebar)
3. Find **Google API Setup** section
4. Paste your **Client ID**
5. Paste your **Client Secret**
6. Click **Save Credentials**

Now the **Gmail Connection** section will be enabled. Click **Connect Gmail** to authenticate!`,
        type: 'tip',
      },
      {
        title: 'Troubleshooting',
        content: `**"Access blocked" error:**
- Make sure you added your email as a Test User in OAuth consent screen

**"Invalid client" error:**
- Double-check Client ID and Secret are copied correctly
- Make sure you selected "Desktop app" as application type

**"Redirect URI mismatch":**
- The app uses \`http://localhost:8085/oauth2callback\`
- This is automatically configured for Desktop apps

**Still stuck?**
- Try creating fresh credentials
- Make sure Gmail API is enabled
- Check that your project is selected in Cloud Console`,
        type: 'warning',
      },
    ],
  },
];

interface TutorialsProps {
  isElectron: boolean;
}

export function Tutorials({ isElectron }: TutorialsProps) {
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { theme } = useTheme();
  const t = themes[theme];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderContent = (text: string) => {
    // Simple markdown-like rendering
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className="font-semibold mt-3 mb-1" style={{ color: t.text }}>
            {line.slice(2, -2)}
          </p>
        );
      }
      // Bold text inline
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <p key={i} className="mb-1" style={{ color: t.textMuted }}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} style={{ color: t.text }}>{part}</strong> : part
            )}
          </p>
        );
      }
      // Links
      if (line.includes('[') && line.includes('](')) {
        const linkMatch = line.match(/\[(.+?)\]\((.+?)\)/);
        if (linkMatch) {
          const [full, text, url] = linkMatch;
          const before = line.slice(0, line.indexOf(full));
          const after = line.slice(line.indexOf(full) + full.length);
          return (
            <p key={i} className="mb-1" style={{ color: t.textMuted }}>
              {before}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:underline inline-flex items-center gap-1"
              >
                {text}
                <ExternalLink size={12} />
              </a>
              {after}
            </p>
          );
        }
      }
      // List items
      if (line.startsWith('- ')) {
        return (
          <p key={i} className="mb-1 pl-4 flex items-start gap-2" style={{ color: t.textMuted }}>
            <span className="text-emerald-500 mt-1">•</span>
            <span>{line.slice(2)}</span>
          </p>
        );
      }
      // Numbered items
      if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\./)?.[1];
        return (
          <p key={i} className="mb-1 pl-4 flex items-start gap-2" style={{ color: t.textMuted }}>
            <span className="text-emerald-500 font-medium min-w-[20px]">{num}.</span>
            <span>{line.replace(/^\d+\.\s/, '')}</span>
          </p>
        );
      }
      // Inline code
      if (line.includes('`')) {
        const parts = line.split(/`(.+?)`/g);
        return (
          <p key={i} className="mb-1" style={{ color: t.textMuted }}>
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <code
                  key={j}
                  className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{ background: t.bgInput, color: t.accentLight }}
                >
                  {part}
                </code>
              ) : part
            )}
          </p>
        );
      }
      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <p
            key={i}
            className="mb-1 pl-4 py-1 border-l-2 italic"
            style={{ borderColor: t.accent, color: t.textMuted }}
          >
            {line.slice(2)}
          </p>
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Regular text
      return (
        <p key={i} className="mb-1" style={{ color: t.textMuted }}>
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: t.text }}>
            Tutorials
          </h1>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>
            Learn how to get the most out of Sanchay
          </p>
        </div>

        {/* Tutorial Cards */}
        {TUTORIALS.map((tutorial) => {
          const isExpanded = expandedTutorial === tutorial.id;

          return (
            <div
              key={tutorial.id}
              className="rounded-xl overflow-hidden"
              style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
            >
              {/* Tutorial Header */}
              <button
                onClick={() => setExpandedTutorial(isExpanded ? null : tutorial.id)}
                className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className="p-2.5 rounded-lg"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                >
                  {tutorial.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: t.text }}>
                    {tutorial.title}
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: t.textMuted }}>
                    {tutorial.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        tutorial.difficulty === 'easy'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {tutorial.difficulty === 'easy' ? 'Easy' : 'Medium'}
                    </span>
                    <span className="text-xs" style={{ color: t.textDim }}>
                      {tutorial.timeEstimate}
                    </span>
                  </div>
                </div>
                <div style={{ color: t.textMuted }}>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>

              {/* Tutorial Content */}
              {isExpanded && (
                <div
                  className="px-5 pb-5 space-y-4"
                  style={{ borderTop: `1px solid ${t.border}` }}
                >
                  <div className="pt-4" />
                  {tutorial.content.map((section, idx) => (
                    <div key={idx}>
                      {/* Section Title */}
                      <h4
                        className="font-medium mb-3 flex items-center gap-2"
                        style={{ color: t.text }}
                      >
                        {section.type === 'info' && (
                          <Shield size={16} className="text-blue-500" />
                        )}
                        {section.type === 'warning' && (
                          <AlertCircle size={16} className="text-amber-500" />
                        )}
                        {section.type === 'tip' && (
                          <CheckCircle size={16} className="text-emerald-500" />
                        )}
                        {section.title}
                      </h4>

                      {/* Section Content */}
                      <div
                        className={`rounded-lg p-4 ${
                          section.type === 'info'
                            ? 'bg-blue-500/10 border border-blue-500/20'
                            : section.type === 'warning'
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : section.type === 'tip'
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : ''
                        }`}
                        style={
                          !section.type
                            ? { background: t.bgInput }
                            : undefined
                        }
                      >
                        {renderContent(section.content)}

                        {/* Code Block */}
                        {section.code && (
                          <div className="mt-3 relative">
                            <pre
                              className="p-3 rounded-lg text-sm font-mono overflow-x-auto"
                              style={{ background: t.bgSolid, color: t.text }}
                            >
                              {section.code}
                            </pre>
                            <button
                              onClick={() => handleCopyCode(section.code!, `${tutorial.id}-${idx}`)}
                              className="absolute top-2 right-2 p-1.5 rounded hover:bg-white/10 transition-colors"
                              style={{ color: t.textMuted }}
                            >
                              {copiedCode === `${tutorial.id}-${idx}` ? (
                                <Check size={14} className="text-emerald-500" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Go to Settings Button */}
                  {tutorial.id === 'google-auth' && (
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          // This would ideally trigger navigation to settings
                          // For now, we'll just show a message
                          window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
                        }}
                        className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        }}
                      >
                        Go to Settings to Configure
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* More Tutorials Coming */}
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
        >
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: t.textMuted }} />
          <h3 className="font-medium" style={{ color: t.text }}>
            More Tutorials Coming Soon
          </h3>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>
            AI setup, budget planning, and more
          </p>
        </div>
      </div>
    </div>
  );
}
