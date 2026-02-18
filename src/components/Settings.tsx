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
  Server,
  Key,
  Eye,
  EyeOff,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';
import type { AIProviderType, AIProviderConfig, AIProviderStatus, AIProviderInfo, MaskedGoogleCredentials } from '@/types';

interface SettingsProps {
  isElectron: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isSyncing: boolean;
  lastSync?: string;
}

const PROVIDER_ICONS: Record<AIProviderType, string> = {
  ollama: '🦙',
  openai: '🤖',
  gemini: '✨',
  openrouter: '🔀',
};

const PROVIDER_LINKS: Record<AIProviderType, string> = {
  ollama: 'https://ollama.com',
  openai: 'https://platform.openai.com/api-keys',
  gemini: 'https://aistudio.google.com/app/apikey',
  openrouter: 'https://openrouter.ai/keys',
};

export function Settings({
  isElectron,
  isConnected,
  onConnect,
  onDisconnect,
  isSyncing,
  lastSync,
}: SettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Google credentials state
  const [hasGoogleCreds, setHasGoogleCreds] = useState(false);
  const [googleCreds, setGoogleCreds] = useState<MaskedGoogleCredentials>({ clientId: null, clientSecret: null });
  const [newClientId, setNewClientId] = useState('');
  const [newClientSecret, setNewClientSecret] = useState('');
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [savingGoogleCreds, setSavingGoogleCreds] = useState(false);

  // AI config state
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>({
    type: 'ollama',
    enabled: false,
  });
  const [providers, setProviders] = useState<Record<AIProviderType, AIProviderInfo>>({
    ollama: { name: 'Ollama', description: 'Free, local AI', requiresKey: false },
    openai: { name: 'OpenAI', description: 'GPT-4o Mini', requiresKey: true },
    gemini: { name: 'Google Gemini', description: 'Gemini 1.5 Flash', requiresKey: true },
    openrouter: { name: 'OpenRouter', description: 'Multiple models', requiresKey: true },
  });
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus>({
    available: false,
  });
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const { theme } = useTheme();
  const t = themes[theme];

  useEffect(() => {
    if (isElectron && window.electronAPI?.ai) {
      loadAIConfig();
      loadProviders();
    }
    if (isElectron && window.electronAPI?.google) {
      loadGoogleCredentials();
    }
  }, [isElectron]);

  useEffect(() => {
    if (isElectron && window.electronAPI?.ai && aiConfig.type) {
      checkProviderStatus();
      loadMaskedKey();
    }
  }, [isElectron, aiConfig.type]);

  // Google credentials functions
  const loadGoogleCredentials = async () => {
    try {
      const hasCreds = await window.electronAPI.google.hasCredentials();
      setHasGoogleCreds(hasCreds);
      if (hasCreds) {
        const creds = await window.electronAPI.google.getCredentials();
        setGoogleCreds(creds);
      }
    } catch (error) {
      console.error('Failed to load Google credentials:', error);
    }
  };

  const handleSaveGoogleCredentials = async () => {
    if (!newClientId.trim() || !newClientSecret.trim() || !window.electronAPI?.google) return;

    setSavingGoogleCreds(true);
    try {
      await window.electronAPI.google.setCredentials({
        clientId: newClientId.trim(),
        clientSecret: newClientSecret.trim(),
      });
      setHasGoogleCreds(true);
      const creds = await window.electronAPI.google.getCredentials();
      setGoogleCreds(creds);
      setNewClientId('');
      setNewClientSecret('');
    } catch (error) {
      console.error('Failed to save Google credentials:', error);
    } finally {
      setSavingGoogleCreds(false);
    }
  };

  const handleClearGoogleCredentials = async () => {
    if (!window.electronAPI?.google) return;

    try {
      await window.electronAPI.google.clearCredentials();
      setHasGoogleCreds(false);
      setGoogleCreds({ clientId: null, clientSecret: null });
    } catch (error) {
      console.error('Failed to clear Google credentials:', error);
    }
  };

  // AI config functions
  const loadAIConfig = async () => {
    try {
      const config = await window.electronAPI.ai.getConfig();
      setAiConfig(config);
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const providerInfo = await window.electronAPI.ai.getProviders();
      setProviders(providerInfo);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const loadMaskedKey = async () => {
    try {
      const key = await window.electronAPI.ai.getMaskedKey(aiConfig.type);
      setMaskedKey(key);
    } catch (error) {
      console.error('Failed to load masked key:', error);
    }
  };

  const checkProviderStatus = async () => {
    setCheckingStatus(true);
    try {
      const status = await window.electronAPI.ai.checkStatus(aiConfig.type);
      setProviderStatus(status);
    } catch (error) {
      console.error('Failed to check provider status:', error);
      setProviderStatus({ available: false, error: 'Failed to check status' });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSaveConfig = async (updates: Partial<AIProviderConfig>) => {
    if (!window.electronAPI?.ai) return;

    setSavingConfig(true);
    try {
      const newConfig = { ...aiConfig, ...updates };
      await window.electronAPI.ai.setConfig(newConfig);
      setAiConfig(newConfig);

      if (updates.type) {
        const status = await window.electronAPI.ai.checkStatus(updates.type);
        setProviderStatus(status);
        const key = await window.electronAPI.ai.getMaskedKey(updates.type);
        setMaskedKey(key);
      }
    } catch (error) {
      console.error('Failed to save AI config:', error);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleAI = async () => {
    await handleSaveConfig({ enabled: !aiConfig.enabled });
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim() || !window.electronAPI?.ai) return;

    setSavingConfig(true);
    try {
      await window.electronAPI.ai.setConfig({ apiKey: newApiKey.trim() });
      const key = await window.electronAPI.ai.getMaskedKey(aiConfig.type);
      setMaskedKey(key);
      setNewApiKey('');
      const status = await window.electronAPI.ai.checkStatus(aiConfig.type);
      setProviderStatus(status);
    } catch (error) {
      console.error('Failed to save API key:', error);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleClearApiKey = async () => {
    if (!window.electronAPI?.ai) return;

    try {
      await window.electronAPI.ai.setConfig({ apiKey: '' });
      setMaskedKey(null);
      const status = await window.electronAPI.ai.checkStatus(aiConfig.type);
      setProviderStatus(status);
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
    setShowDeleteConfirm(false);
  };

  const currentProvider = providers[aiConfig.type];
  const canEnable = providerStatus.available || (!currentProvider?.requiresKey && aiConfig.type === 'ollama');

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

        {/* Google API Configuration */}
        <div
          className="rounded-xl"
          style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
        >
          <div className="p-5" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Settings2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: t.text }}>Google API Setup</h3>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Required for Gmail integration
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {hasGoogleCreds ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-emerald-500" size={20} />
                    <div>
                      <p className="font-medium" style={{ color: t.text }}>Credentials Configured</p>
                      <p className="text-xs font-mono" style={{ color: t.textMuted }}>
                        {googleCreds.clientId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearGoogleCredentials}
                    className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium" style={{ color: t.text }}>
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    placeholder="xxxx.apps.googleusercontent.com"
                    className="w-full mt-1 px-4 py-3 rounded-lg text-sm font-mono"
                    style={{
                      background: t.bgInput,
                      color: t.text,
                      border: `1px solid ${t.border}`,
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: t.text }}>
                    Client Secret
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showClientSecret ? 'text' : 'password'}
                      value={newClientSecret}
                      onChange={(e) => setNewClientSecret(e.target.value)}
                      placeholder="GOCSPX-..."
                      className="w-full px-4 py-3 rounded-lg text-sm font-mono pr-12"
                      style={{
                        background: t.bgInput,
                        color: t.text,
                        border: `1px solid ${t.border}`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowClientSecret(!showClientSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: t.textMuted }}
                    >
                      {showClientSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSaveGoogleCredentials}
                  disabled={!newClientId.trim() || !newClientSecret.trim() || savingGoogleCreds}
                  className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingGoogleCreds ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            )}

            <div className="p-4 rounded-lg" style={{ background: t.bgInput }}>
              <h4 className="text-sm font-medium mb-2" style={{ color: t.text }}>How to get credentials:</h4>
              <ol className="text-sm space-y-1.5" style={{ color: t.textMuted }}>
                <li>1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a></li>
                <li>2. Create a project → Enable Gmail API</li>
                <li>3. Configure OAuth consent screen</li>
                <li>4. Create OAuth 2.0 credentials (Desktop app)</li>
                <li>5. Copy Client ID and Secret here</li>
              </ol>
            </div>
          </div>
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
            {!hasGoogleCreds ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-500 font-medium">Google API not configured</p>
                <p className="text-xs mt-1" style={{ color: t.textMuted }}>
                  Please set up Google API credentials above first.
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* AI Provider Configuration */}
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
                  Choose your AI provider for intelligent categorization
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: t.text }}>
                Provider
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className="w-full px-4 py-3 rounded-lg text-sm flex items-center justify-between"
                  style={{
                    background: t.bgInput,
                    color: t.text,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span>{PROVIDER_ICONS[aiConfig.type]}</span>
                    <span>{currentProvider?.name}</span>
                    <span className="text-xs" style={{ color: t.textMuted }}>
                      - {currentProvider?.description}
                    </span>
                  </span>
                  <ChevronDown size={16} />
                </button>

                {showProviderDropdown && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-10 overflow-hidden"
                    style={{ background: t.bgSolid, border: `1px solid ${t.border}` }}
                  >
                    {(Object.keys(providers) as AIProviderType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          handleSaveConfig({ type });
                          setShowProviderDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors"
                        style={{ color: t.text }}
                      >
                        <span>{PROVIDER_ICONS[type]}</span>
                        <span className="font-medium">{providers[type].name}</span>
                        <span className="text-xs" style={{ color: t.textMuted }}>
                          - {providers[type].description}
                        </span>
                        {type === aiConfig.type && (
                          <CheckCircle size={14} className="ml-auto text-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Provider Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server size={20} style={{ color: providerStatus.available ? '#10b981' : t.textMuted }} />
                <div>
                  <p className="font-medium" style={{ color: t.text }}>Status</p>
                  <p className="text-sm" style={{ color: t.textMuted }}>
                    {providerStatus.available
                      ? providerStatus.models?.length
                        ? `Available (${providerStatus.models.length} models)`
                        : 'Available'
                      : providerStatus.error || 'Not available'}
                  </p>
                </div>
              </div>
              <button
                onClick={checkProviderStatus}
                disabled={checkingStatus}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: t.bgInput, color: t.text }}
              >
                {checkingStatus ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>

            {/* API Key (if required) */}
            {currentProvider?.requiresKey && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key size={16} style={{ color: t.textMuted }} />
                    <span className="text-sm font-medium" style={{ color: t.text }}>
                      API Key
                    </span>
                  </div>
                  {maskedKey && (
                    <button
                      onClick={handleClearApiKey}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {maskedKey ? (
                  <div
                    className="px-4 py-3 rounded-lg text-sm font-mono"
                    style={{ background: t.bgInput, color: t.textMuted }}
                  >
                    {maskedKey}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        placeholder="Enter your API key..."
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
                      disabled={!newApiKey.trim() || savingConfig}
                      className="w-full px-4 py-2.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingConfig ? 'Saving...' : 'Save API Key'}
                    </button>
                  </div>
                )}

                <p className="text-xs" style={{ color: t.textDim }}>
                  Get your API key from{' '}
                  <a
                    href={PROVIDER_LINKS[aiConfig.type]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:underline"
                  >
                    {PROVIDER_LINKS[aiConfig.type].replace('https://', '')}
                  </a>
                </p>
              </div>
            )}

            {/* Ollama Install Instructions */}
            {aiConfig.type === 'ollama' && !providerStatus.available && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-500 font-medium">Ollama not detected</p>
                <p className="text-xs mt-1" style={{ color: t.textMuted }}>
                  Install Ollama from{' '}
                  <a
                    href="https://ollama.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:underline"
                  >
                    ollama.com
                  </a>
                  {' '}and run:{' '}
                  <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: t.bgSolid }}>
                    ollama run llama3.2
                  </code>
                </p>
              </div>
            )}

            {/* Model Selection */}
            {providerStatus.available && providerStatus.models && providerStatus.models.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: t.text }}>
                  Model
                </label>
                <select
                  value={aiConfig.model || ''}
                  onChange={(e) => handleSaveConfig({ model: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: t.bgInput,
                    color: t.text,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {providerStatus.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Enable/Disable Toggle */}
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: t.bgInput }}
            >
              <div>
                <p className="font-medium" style={{ color: t.text }}>Enable AI Processing</p>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Use {currentProvider?.name} to categorize transactions
                </p>
              </div>
              <button
                onClick={handleToggleAI}
                disabled={!canEnable || savingConfig}
                className="relative w-12 h-6 rounded-full transition-colors disabled:opacity-50"
                style={{ background: aiConfig.enabled ? '#10b981' : t.border }}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    aiConfig.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
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
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
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
                  <p className="font-medium" style={{ color: t.text }}>
                    {aiConfig.type === 'ollama' ? 'Fully Local AI' : 'API-based AI'}
                  </p>
                  <p className="text-sm" style={{ color: t.textMuted }}>
                    {aiConfig.type === 'ollama'
                      ? 'Zero data sent to external servers'
                      : 'Minimal data sent only for processing'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  aiConfig.type === 'ollama'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                {aiConfig.type === 'ollama' ? 'Private' : 'External'}
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
