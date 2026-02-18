'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Shield,
  Bell,
  Database,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  Brain,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';

interface SettingsProps {
  isElectron: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isSyncing: boolean;
  lastSync?: string;
}

export function Settings({
  isElectron,
  isConnected,
  onConnect,
  onDisconnect,
  isSyncing,
  lastSync,
}: SettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [aiKeyConfigured, setAiKeyConfigured] = useState(false);
  const [aiKeyDisplay, setAiKeyDisplay] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const { theme } = useTheme();
  const t = themes[theme];

  useEffect(() => {
    if (isElectron && window.electronAPI?.ai) {
      loadAiKeyStatus();
    }
  }, [isElectron]);

  const loadAiKeyStatus = async () => {
    try {
      const hasKey = await window.electronAPI.ai.hasApiKey();
      setAiKeyConfigured(hasKey);
      if (hasKey) {
        const maskedKey = await window.electronAPI.ai.getApiKey();
        setAiKeyDisplay(maskedKey);
      }
    } catch (error) {
      console.error('Failed to load AI key status:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim() || !window.electronAPI?.ai) return;

    setSavingKey(true);
    try {
      await window.electronAPI.ai.setApiKey(newApiKey.trim());
      setAiKeyConfigured(true);
      const maskedKey = await window.electronAPI.ai.getApiKey();
      setAiKeyDisplay(maskedKey);
      setNewApiKey('');
    } catch (error) {
      console.error('Failed to save API key:', error);
    } finally {
      setSavingKey(false);
    }
  };

  const handleClearApiKey = async () => {
    if (!window.electronAPI?.ai) return;

    try {
      await window.electronAPI.ai.clearApiKey();
      setAiKeyConfigured(false);
      setAiKeyDisplay(null);
    } catch (error) {
      console.error('Failed to clear API key:', error);
    }
  };

  const formatLastSync = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleClearData = async () => {
    if (!isElectron || !window.electronAPI) return;

    // This would clear all local data
    // For now, just close the dialog
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: t.text }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>
            Manage your account and preferences
          </p>
        </div>

        {/* Gmail Connection */}
        <div
          className="rounded-xl"
          style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
        >
          <div className="p-5" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: t.text }}>Gmail Connection</h3>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Connect your Gmail to sync financial emails
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <CheckCircle className="text-emerald-500" size={20} />
                ) : (
                  <XCircle size={20} style={{ color: t.textMuted }} />
                )}
                <div>
                  <p className="font-medium" style={{ color: t.text }}>
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </p>
                  {isConnected && lastSync && (
                    <p className="text-sm" style={{ color: t.textMuted }}>
                      Last sync: {formatLastSync(lastSync)}
                    </p>
                  )}
                </div>
              </div>

              {isConnected ? (
                <button
                  onClick={onDisconnect}
                  className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={onConnect}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isSyncing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    'Connect Gmail'
                  )}
                </button>
              )}
            </div>

            <div className="mt-4 p-4 rounded-lg" style={{ background: t.bgInput }}>
              <h4 className="text-sm font-medium mb-2" style={{ color: t.text }}>What we access:</h4>
              <ul className="text-sm space-y-1" style={{ color: t.textMuted }}>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Read-only access to emails
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Only financial transaction emails
                </li>
                <li className="flex items-center gap-2">
                  <XCircle size={14} className="text-red-500" />
                  Never send emails on your behalf
                </li>
                <li className="flex items-center gap-2">
                  <XCircle size={14} className="text-red-500" />
                  Never share your data with third parties
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div
          className="rounded-xl"
          style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
        >
          <div className="p-5" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                <Brain size={20} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: t.text }}>AI Processing</h3>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Intelligent transaction categorization
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {aiKeyConfigured ? (
                  <CheckCircle className="text-emerald-500" size={20} />
                ) : (
                  <Key size={20} style={{ color: t.textMuted }} />
                )}
                <div>
                  <p className="font-medium" style={{ color: t.text }}>
                    OpenAI API Key
                  </p>
                  {aiKeyConfigured && aiKeyDisplay && (
                    <p className="text-sm font-mono" style={{ color: t.textMuted }}>
                      {aiKeyDisplay}
                    </p>
                  )}
                </div>
              </div>

              {aiKeyConfigured && (
                <button
                  onClick={handleClearApiKey}
                  className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            {!aiKeyConfigured && (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 rounded-lg text-sm font-mono pr-12"
                    style={{
                      background: t.bgInput,
                      color: t.text,
                      border: `1px solid ${t.border}`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: t.textMuted }}
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  onClick={handleSaveApiKey}
                  disabled={!newApiKey.trim() || savingKey}
                  className="w-full px-4 py-2.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingKey ? 'Saving...' : 'Save API Key'}
                </button>
              </div>
            )}

            <div className="mt-4 p-4 rounded-lg" style={{ background: t.bgInput }}>
              <h4 className="text-sm font-medium mb-2" style={{ color: t.text }}>
                Why do we need this?
              </h4>
              <ul className="text-sm space-y-1.5" style={{ color: t.textMuted }}>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Smarter transaction categorization using AI</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Works with any bank or payment service worldwide</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Your API key stays on your device</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <span>Emails processed via OpenAI API (minimal data sent)</span>
                </li>
              </ul>
              <p className="text-xs mt-3" style={{ color: t.textDim }}>
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-500 hover:underline"
                >
                  platform.openai.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div
          className="rounded-xl"
          style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
        >
          <div className="p-5" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: t.text }}>Privacy & Security</h3>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Your data stays on your device
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: t.bgInput }}
            >
              <div className="flex items-center gap-3">
                <Database size={18} style={{ color: t.textMuted }} />
                <div>
                  <p className="font-medium" style={{ color: t.text }}>Local Storage</p>
                  <p className="text-sm" style={{ color: t.textMuted }}>
                    All data stored locally on your Mac
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-medium">
                Secure
              </span>
            </div>

            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: t.bgInput }}
            >
              <div className="flex items-center gap-3">
                <Shield size={18} style={{ color: t.textMuted }} />
                <div>
                  <p className="font-medium" style={{ color: t.text }}>No Backend</p>
                  <p className="text-sm" style={{ color: t.textMuted }}>
                    Zero data sent to external servers
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-medium">
                Private
              </span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div
          className="rounded-xl"
          style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
        >
          <div className="p-5" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: t.text }}>Notifications</h3>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Configure alerts and reminders
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <ToggleSetting
              label="Subscription Reminders"
              description="Get notified before subscriptions renew"
              defaultChecked={true}
              theme={theme}
            />
            <ToggleSetting
              label="Large Transaction Alerts"
              description="Alert for transactions over ₹10,000"
              defaultChecked={true}
              theme={theme}
            />
            <ToggleSetting
              label="Weekly Summary"
              description="Weekly spending report every Monday"
              defaultChecked={false}
              theme={theme}
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div
          className="rounded-xl"
          style={{ background: t.bgCard, border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <div className="p-5" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-red-500">Danger Zone</h3>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Irreversible actions
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium" style={{ color: t.text }}>Clear All Data</p>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Delete all transactions, subscriptions, and settings
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div
          className="rounded-xl p-5"
          style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h3 className="font-semibold text-lg" style={{ color: t.text }}>Sanchay</h3>
            <p className="text-sm mt-1" style={{ color: t.textMuted }}>
              AI Financial Intelligence Layer
            </p>
            <p className="text-xs mt-2" style={{ color: t.textDim }}>Version 1.0.0</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <a
                href="#"
                className="text-sm text-emerald-500 hover:underline flex items-center gap-1"
              >
                Documentation <ExternalLink size={12} />
              </a>
              <a
                href="#"
                className="text-sm text-emerald-500 hover:underline flex items-center gap-1"
              >
                Report Issue <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 max-w-md mx-4"
            style={{ background: t.bgSolid, border: `1px solid ${t.border}` }}
          >
            <h3 className="text-lg font-semibold text-red-500">Clear All Data?</h3>
            <p className="mt-2" style={{ color: t.textMuted }}>
              This will permanently delete all your transactions, subscriptions,
              and settings. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: t.bgInput, color: t.text }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
  theme: 'light' | 'dark';
}

function ToggleSetting({ label, description, defaultChecked = false, theme }: ToggleSettingProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const t = themes[theme];

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg"
      style={{ background: t.bgInput }}
    >
      <div>
        <p className="font-medium" style={{ color: t.text }}>{label}</p>
        <p className="text-sm" style={{ color: t.textMuted }}>{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className="relative w-12 h-6 rounded-full transition-colors"
        style={{ background: checked ? '#10b981' : t.border }}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
