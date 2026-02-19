'use client';

import { useEffect, useState } from 'react';
import {
  Sidebar,
  Dashboard,
  Subscriptions,
  Insights,
  Income,
  Transactions,
  Settings,
  Onboarding,
  Tutorials,
  Verbose,
} from '@/components';
import { useTheme, themes } from '@/lib/theme';
import type { SyncProgress } from '@/types';

export default function Home() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isElectron, setIsElectron] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | undefined>();
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [pendingAuthSync, setPendingAuthSync] = useState(false);
  const { theme } = useTheme();
  const t = themes[theme];

  const SYNC_PERIODS = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last year', days: 365 },
    { label: 'All time', days: 3650 },
  ];

  useEffect(() => {
    const electronAvailable = typeof window !== 'undefined' && window.electronAPI;
    setIsElectron(!!electronAvailable);

    // Check if onboarding has been completed
    const onboardingComplete = localStorage.getItem('sanchay_onboarding_complete');
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
    setIsLoading(false);

    // Handle navigation events from child components
    const handleNavigate = (e: CustomEvent) => {
      setCurrentView(e.detail);
    };
    window.addEventListener('navigate', handleNavigate as EventListener);

    if (electronAvailable) {
      checkAuthStatus();
      loadLastSync();

      const unsubscribe = window.electronAPI.gmail.onSyncProgress((progress) => {
        setSyncProgress(progress);
      });

      return () => {
        unsubscribe();
        window.removeEventListener('navigate', handleNavigate as EventListener);
      };
    }

    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('sanchay_onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  const checkAuthStatus = async () => {
    try {
      const result = await window.electronAPI.gmail.checkAuth();
      setIsConnected(result.authenticated);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    }
  };

  const loadLastSync = async () => {
    try {
      const lastSyncTime = await window.electronAPI.gmail.getLastSync();
      setLastSync(lastSyncTime || undefined);
    } catch (error) {
      console.error('Failed to load last sync:', error);
    }
  };

  const handleConnect = async () => {
    if (!isElectron) return;
    try {
      setIsSyncing(true);
      const result = await window.electronAPI.gmail.authenticate();
      if (result.success) {
        setIsConnected(true);
        setPendingAuthSync(true);
        setShowSyncModal(true);
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isElectron) return;
    try {
      await window.electronAPI.gmail.disconnect();
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleSyncWithDays = async (daysBack: number) => {
    if (!isElectron || !isConnected) return;
    setShowSyncModal(false);
    setPendingAuthSync(false);
    try {
      setIsSyncing(true);
      setSyncProgress(null);
      const result = await window.electronAPI.gmail.syncEmails({ daysBack });
      if (result.success) {
        setLastSync(new Date().toISOString());
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleSync = () => {
    if (!isElectron || !isConnected) return;
    setShowSyncModal(true);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard isElectron={isElectron} />;
      case 'transactions':
        return <Transactions isElectron={isElectron} />;
      case 'subscriptions':
        return <Subscriptions isElectron={isElectron} />;
      case 'income':
        return <Income isElectron={isElectron} />;
      case 'insights':
        return <Insights isElectron={isElectron} />;
      case 'tutorials':
        return <Tutorials isElectron={isElectron} />;
      case 'verbose':
        return <Verbose isElectron={isElectron} />;
      case 'settings':
        return (
          <Settings
            isElectron={isElectron}
            isConnected={isConnected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            isSyncing={isSyncing}
            lastSync={lastSync}
          />
        );
      default:
        return <Dashboard isElectron={isElectron} />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: t.bg }}
      >
        <div
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${t.accent} transparent ${t.accent} ${t.accent}` }}
        />
      </div>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-500 relative"
      style={{ background: t.bg }}
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top gradient orb - purple/blue */}
        <div
          className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Bottom gradient orb - emerald */}
        <div
          className="absolute -bottom-[30%] -left-[20%] w-[60%] h-[60%] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isConnected={isConnected}
        isSyncing={isSyncing}
        onSync={isConnected ? handleSync : handleConnect}
        lastSync={lastSync}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top drag region */}
        <div className="h-[52px] shrink-0 drag-region" />

        {/* Sync Progress */}
        {isSyncing && syncProgress && (
          <div
            className="px-6 py-3 shrink-0 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: t.accentLight }} className="font-medium flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Syncing emails... {syncProgress.processed}/{syncProgress.total}
              </span>
              <span style={{ color: t.textMuted }}>
                {syncProgress.newTransactions} new transactions
              </span>
            </div>
            <div
              className="h-1 rounded-full mt-2 overflow-hidden"
              style={{ background: 'rgba(16, 185, 129, 0.1)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(syncProgress.processed / syncProgress.total) * 100}%`,
                  background: 'linear-gradient(90deg, #10b981, #34d399)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderView()}
        </div>
      </main>

      {/* Sync Period Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowSyncModal(false);
              setPendingAuthSync(false);
            }}
          />
          <div
            className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: t.text }}>
              Sync Period
            </h3>
            <p className="text-sm mb-6" style={{ color: t.textMuted }}>
              How far back should we sync your emails?
            </p>

            <div className="space-y-2">
              {SYNC_PERIODS.map((period) => (
                <button
                  key={period.days}
                  onClick={() => handleSyncWithDays(period.days)}
                  className="w-full px-4 py-3 rounded-xl text-left font-medium transition-all hover:scale-[1.02]"
                  style={{
                    background: t.bgInput,
                    color: t.text,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {period.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowSyncModal(false);
                setPendingAuthSync(false);
              }}
              className="w-full mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ color: t.textMuted }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
